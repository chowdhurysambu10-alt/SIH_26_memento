import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async generateAlias(user: AuthenticatedUser, publicKey: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Check if user already has an alias
    const { data: existing } = await supabase
      .from('temp_mail_aliases')
      .select('alias_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return { alias_id: existing.alias_id };
    }

    let isUnique = false;
    let aliasId = '';

    // Loop to guarantee absolute uniqueness
    while (!isUnique) {
      // Generate a random 8-character prefix
      const randomPrefix = uuidv4().split('-')[0];
      aliasId = `${randomPrefix}@mmtomail.com`;

      const { data: taken } = await supabase
        .from('temp_mail_aliases')
        .select('alias_id')
        .eq('alias_id', aliasId)
        .maybeSingle();

      if (!taken) {
        isUnique = true;
      }
    }
    
    const { error } = await supabase
      .from('temp_mail_aliases')
      .insert({
        user_id: user.id,
        alias_id: aliasId,
        public_key: publicKey,
      });

    if (error) {
      this.logger.error(`Failed to generate alias: ${error.message}`);
      throw new InternalServerErrorException('Could not generate temporary mail alias');
    }

    return { alias_id: aliasId };
  }

  async getAlias(user: AuthenticatedUser) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('temp_mail_aliases')
      .select('alias_id, public_key')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data;
  }

  async getPublicKey(aliasId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('temp_mail_aliases')
      .select('public_key')
      .eq('alias_id', aliasId)
      .maybeSingle();

    if (error || !data) {
      throw new BadRequestException('Recipient alias not found or invalid.');
    }

    return { public_key: data.public_key };
  }

  async deleteAlias(user: AuthenticatedUser) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Find alias to delete recipient messages
    const { data: alias } = await supabase
      .from('temp_mail_aliases')
      .select('alias_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (alias) {
      await supabase
        .from('temp_messages')
        .delete()
        .or(`recipient_alias_id.eq.${alias.alias_id},sender_id.eq.${user.id}`);
    } else {
      await supabase
        .from('temp_messages')
        .delete()
        .eq('sender_id', user.id);
    }

    const { error } = await supabase
      .from('temp_mail_aliases')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      this.logger.error(`Failed to delete alias: ${error.message}`);
      throw new InternalServerErrorException('Could not delete temporary mail alias');
    }

    return { success: true };
  }

  async sendMessage(user: AuthenticatedUser, dto: SendMessageDto) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { error } = await supabase
      .from('temp_messages')
      .insert({
        recipient_alias_id: dto.recipientAliasId,
        sender_id: user.id,
        encrypted_subject: dto.encryptedSubject,
        encrypted_body: dto.encryptedBody
      });

    if (error) {
      this.logger.error(`Failed to send message: ${error.message}`);
      throw new InternalServerErrorException('Could not send message');
    }

    return { success: true };
  }

  async getInbox(user: AuthenticatedUser) {
    const supabase = this.supabaseService.getAdminClient();
    
    // RLS handles filtering, but we explicitly filter by the user's alias just in case
    const alias = await this.getAlias(user);
    if (!alias) {
      return [];
    }

    const { data, error } = await supabase
      .from('temp_messages')
      .select(`
        id,
        sender_id,
        encrypted_subject,
        encrypted_body,
        created_at
      `)
      .eq('recipient_alias_id', alias.alias_id)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch inbox: ${error.message}`);
      throw new InternalServerErrorException('Could not fetch inbox');
    }

    return data;
  }
}

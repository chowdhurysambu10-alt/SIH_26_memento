import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getMyNotifications(userId: string, unreadOnly = false) {
    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read_status', false);
    }

    const { data, error } = await query;
    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'NOTIFICATIONS_FETCH_FAILED',
      });
    }

    return data;
  }

  async markAsRead(notificationId: string, userId: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('notifications')
      .update({ read_status: true })
      .eq('id', notificationId)
      .eq('recipient_id', userId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'NOTIFICATION_UPDATE_FAILED',
      });
    }

    return data;
  }

  async markAllAsRead(userId: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('notifications')
      .update({ read_status: true })
      .eq('recipient_id', userId);

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'NOTIFICATIONS_MARK_READ_FAILED',
      });
    }

    return { message: 'All notifications marked as read' };
  }

  async sendNotification(recipientId: string, type: string, payload: Record<string, any>) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        type,
        payload,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to send notification to ${recipientId}: ${error.message}`);
    }

    return data;
  }

  async broadcastNotification(role: string, type: string, payload: Record<string, any>) {
    const admin = this.supabaseService.getAdminClient();
    
    let usersQuery = admin.from('users').select('id');
    if (role && role !== 'all') {
      usersQuery = usersQuery.eq('role', role);
    }
    
    const { data: users, error: userError } = await usersQuery;
    if (userError) throw new BadRequestException(userError.message);
    if (!users || users.length === 0) return { message: 'No users found for this role' };

    const notifications = users.map(u => ({
      recipient_id: u.id,
      type,
      payload
    }));

    const { error: insertError } = await admin.from('notifications').insert(notifications);
    if (insertError) throw new BadRequestException(insertError.message);

    return { success: true, count: users.length, message: `Broadcasted to ${users.length} users` };
  }
}

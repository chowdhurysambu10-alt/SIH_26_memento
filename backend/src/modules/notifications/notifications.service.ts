import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getMyNotifications(userId: string, unreadOnly = false) {
    const admin = this.supabaseService.getAdminClient();
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    let query = admin
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .gte('created_at', yesterday.toISOString())
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

  async deleteNotification(notificationId: string, userId: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', userId)
      .select();

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async deleteAllNotifications(userId: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('notifications')
      .delete()
      .eq('recipient_id', userId)
      .select();

    if (error) {
      throw new BadRequestException(error.message);
    }
    return { success: true, count: data.length };
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
    
    // 1. Fetch target users
    let query = admin.from('users').select('id');
    if (role !== 'all') {
      query = query.eq('role', role);
    }
    
    const { data: users, error: fetchError } = await query;
    if (fetchError) {
      throw new BadRequestException({
        statusCode: 400,
        message: fetchError.message,
        errorCode: 'USERS_FETCH_FAILED',
      });
    }

    if (!users || users.length === 0) {
      return { success: true, count: 0, message: 'No users found for broadcast' };
    }

    // 2. Prepare payload for bulk insert
    const notifications = users.map(u => ({
      recipient_id: u.id,
      type,
      payload,
      read_status: false,
    }));

    // 3. Bulk insert
    const { error: insertError } = await admin.from('notifications').insert(notifications);
    if (insertError) {
      this.logger.error(`Failed to broadcast notification: ${insertError.message}`);
      throw new BadRequestException({
        statusCode: 400,
        message: insertError.message,
        errorCode: 'BROADCAST_FAILED',
      });
    }

    return { success: true, count: users.length, message: `Broadcast sent to ${users.length} users` };
  }
}

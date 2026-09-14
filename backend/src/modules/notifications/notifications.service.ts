import { BadRequestException, Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SettingsService } from '../settings/settings.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly supabaseService: SupabaseService,
    @Inject(forwardRef(() => SettingsService)) private readonly settingsService: SettingsService
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

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

  async broadcastNotification(role: string, type: string, payload: Record<string, any>, method: string = 'in-site') {
    const admin = this.supabaseService.getAdminClient();
    
    let usersQuery = admin.from('users').select('id, email');
    if (role && role !== 'all') {
      usersQuery = usersQuery.eq('role', role);
    }
    
    const { data: users, error: userError } = await usersQuery;
    if (userError) throw new BadRequestException(userError.message);
    if (!users || users.length === 0) return { message: 'No users found for this role' };

    if (method === 'email') {
      const settings = await this.settingsService.getSettings();
      if (!settings.enableEmailService) {
        this.logger.log(`Skipped broadcasting emails (Email Service Disabled)`);
        return { message: 'Emails were not sent because the email service is disabled globally.' };
      }

      const emailPromises = users.map(u => 
        this.transporter.sendMail({
          from: `"Memento Portal" <${process.env.SMTP_USER}>`,
          to: u.email,
          subject: payload.title,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Official Notice</h2>
            <p>${payload.message}</p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">This is an automated administrative broadcast from the Memento portal.</p>
          </div>`
        })
      );
      
      try {
        await Promise.all(emailPromises);
      } catch (err) {
        this.logger.error(`Failed to broadcast email: ${err.message}`);
        throw new BadRequestException('Failed to send emails to some users.');
      }
      
      return { success: true, count: users.length, message: `Emailed ${users.length} users successfully.` };
    } else {
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

  async sendVerificationEmail(email: string, name: string, action: 'verify' | 'reject' | 'reverify', role: string = 'university_admin') {
    let subject = '';
    let message = '';
    
    const roleType = role === 'student' ? 'student' : 'institution';

    if (action === 'verify') {
      subject = 'Verification Approved - Memento Portal';
      message = `<h2 style="color: #16a34a;">Congratulations, ${name}!</h2>
        <p>Your ${roleType} account has been successfully verified on the Memento Portal.</p>
        <p>You now have full access to participate on the platform.</p>`;
    } else if (action === 'reject') {
      subject = 'Verification Rejected - Memento Portal';
      message = `<h2 style="color: #dc2626;">Verification Rejected</h2>
        <p>Dear ${name},</p>
        <p>We regret to inform you that your verification request has been rejected, and your account has been disabled.</p>
        <p>If you believe this was a mistake, please contact support.</p>`;
    } else if (action === 'reverify') {
      subject = 'Action Required: Verification Pending - Memento Portal';
      if (role === 'student') {
        message = `<h2 style="color: #ea580c;">Action Required: Verification Pending</h2>
          <p>Dear ${name},</p>
          <p>We are currently reviewing your student verification request.</p>
          <p>Please log in to the portal and follow the formal process for requesting verification, ensuring you have provided a valid student ID card or letter from your institution.</p>`;
      } else {
        message = `<h2 style="color: #ea580c;">Action Required: Verification Pending</h2>
          <p>Dear ${name},</p>
          <p>We are currently reviewing your verification request but require additional proof of documentation.</p>
          <p>Please reply directly to this email with a clear soft copy or photocopy of your official institutional documentation to proceed.</p>`;
      }
    }

    const settings = await this.settingsService.getSettings();
    if (!settings.enableEmailService) {
      this.logger.log(`Skipped sending ${action} email to ${email} (Email Service Disabled)`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"Memento Portal" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          ${message}
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated administrative email from the Memento portal.</p>
        </div>`
      });
      this.logger.log(`Sent ${action} email to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send ${action} email to ${email}: ${err.message}`);
    }
  }
}

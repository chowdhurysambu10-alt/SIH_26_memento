import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UserRole } from '../../common/constants/roles.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getProfile(userId: string) {
    const admin = this.supabaseService.getAdminClient();
    try {
      const { data, error } = await admin
        .from('users')
        .select('id, name, email, role, district, contact, verified, org_id')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      // Fallback
    }

    // Fallback to Supabase Auth user record
    const { data: authData } = await admin.auth.admin.getUserById(userId);
    if (authData?.user) {
      return {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name || 'Citizen User',
        role: authData.user.user_metadata?.role || UserRole.CITIZEN,
        district: authData.user.user_metadata?.district || null,
        verified: true,
      };
    }

    throw new NotFoundException({
      statusCode: 404,
      message: 'User profile not found',
      errorCode: 'USER_NOT_FOUND',
    });
  }

  async updateProfile(userId: string, updates: Partial<{ name: string; contact: string; district: string; email: string }>) {
    const admin = this.supabaseService.getAdminClient();
    
    // If email or name is being updated, sync with auth.users
    if (updates.email || updates.name) {
      const authUpdates: any = {};
      if (updates.email) {
        authUpdates.email = updates.email;
        authUpdates.email_confirm = true; // Auto-confirm email change
      }
      if (updates.name) {
        authUpdates.user_metadata = { name: updates.name };
      }
      
      const { error: authError } = await admin.auth.admin.updateUserById(userId, authUpdates);
      if (authError) {
        throw new BadRequestException({
          statusCode: 400,
          message: authError.message || 'Failed to update authentication credentials',
          errorCode: 'AUTH_UPDATE_FAILED',
        });
      }
    }

    const { data, error } = await admin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'PROFILE_UPDATE_FAILED',
      });
    }

    return data;
  }

  async verifyUser(targetUserId: string, callerRole: UserRole, action: 'verify' | 'reject' | 'reverify' = 'verify') {
    if (callerRole !== UserRole.SUPER_ADMIN && callerRole !== UserRole.GOVT_VIEWER) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Only Super Admin or Govt authorities can verify institutional accounts',
        errorCode: 'FORBIDDEN_ACTION',
      });
    }

    const admin = this.supabaseService.getAdminClient();
    
    let isVerified = false;
    if (action === 'verify') isVerified = true;
    
    // Perform ban if rejected
    if (action === 'reject') {
      await admin.auth.admin.updateUserById(targetUserId, { ban_duration: '87600h' });
    } else if (action === 'verify') {
      // Unban if they were previously banned and are now verified
      await admin.auth.admin.updateUserById(targetUserId, { ban_duration: 'none' });
    }

    const { data, error } = await admin
      .from('users')
      .update({ verified: isVerified })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'VERIFY_FAILED',
      });
    }

    // Send email notification
    if (data && data.email && data.name) {
      this.notificationsService.sendVerificationEmail(data.email, data.name, action, data.role);
    }

    return data;
  }

  async getAllUsers(role?: UserRole, district?: string) {
    const admin = this.supabaseService.getAdminClient();
    let query = admin.from('users').select('id, name, email, role, district, verified, created_at');

    if (role) {
      query = query.eq('role', role);
    }
    if (district) {
      query = query.eq('district', district);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'USERS_FETCH_FAILED',
      });
    }

    return data;
  }

  async deleteUser(userId: string) {
    const admin = this.supabaseService.getAdminClient();
    
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    
    if (authError) {
      throw new BadRequestException({
        statusCode: 400,
        message: authError.message,
        errorCode: 'USER_DELETE_FAILED',
      });
    }

    return { success: true, message: 'User deleted successfully' };
  }
}

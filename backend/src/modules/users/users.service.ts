import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UserRole } from '../../common/constants/roles.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

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
    
    // 1. Clean up dependent records to bypass Foreign Key constraints
    try {
      await admin.from('challenge_supports').delete().eq('user_id', userId);
      await admin.from('notifications').delete().eq('recipient_id', userId);
      await admin.from('proposals').delete().eq('institution_id', userId);
      await admin.from('challenges').delete().eq('submitted_by', userId);
      
      // Delete the public user profile record
      await admin.from('users').delete().eq('id', userId);
    } catch (cleanupError: any) {
      console.warn(`Warning during user data cleanup: ${cleanupError.message}`);
    }

    // 2. Delete the actual authentication account
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    
    if (authError) {
      throw new BadRequestException({
        statusCode: 400,
        message: authError.message || 'Database error deleting user',
        errorCode: 'USER_DELETE_FAILED',
      });
    }

    return { success: true, message: 'User deleted successfully' };
  }

  // --- Student Verifications ---

  async submitStudentVerification(user: AuthenticatedUser, institution_name: string, id_card_url: string) {
    const admin = this.supabaseService.getAdminClient();

    // Upsert verification (re-verifying overwrites the previous one)
    const { error } = await admin.from('student_verifications').upsert({
      user_id: user.id,
      institution_name,
      student_id_card_url: id_card_url,
      status: 'pending',
      submitted_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (error) {
      this.logger.error(`Failed to submit student verification: ${error.message}`);
      throw new BadRequestException('Failed to submit verification request.');
    }

    return { success: true };
  }

  async getPendingStudentVerifications(user: AuthenticatedUser) {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can review student verifications.');
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin.from('student_verifications')
      .select('*, user:users!user_id(name, email, contact)')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (error) {
      // Table may not exist yet — return empty array gracefully so admin page doesn't crash
      this.logger.warn(`Could not fetch student verifications (table may not exist yet): ${error.message}`);
      return [];
    }

    return data ?? [];
  }

  async updateStudentVerificationStatus(user: AuthenticatedUser, verificationId: string, status: 'approved' | 'rejected') {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can update student verifications.');
    }

    const admin = this.supabaseService.getAdminClient();
    const { data: verification, error: fetchError } = await admin.from('student_verifications').select('*').eq('id', verificationId).single();
    
    if (fetchError || !verification) {
      throw new NotFoundException('Verification request not found.');
    }

    const { error: updateError } = await admin.from('student_verifications').update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id
    }).eq('id', verificationId);

    if (updateError) {
      throw new BadRequestException('Failed to update verification status.');
    }

    if (status === 'approved') {
      await admin.from('users').update({ verified: true }).eq('id', verification.user_id);
    }

    // Optional: Send notification
    const { data: userData } = await admin.from('users').select('name, email').eq('id', verification.user_id).single();
    if (userData?.email) {
      this.notificationsService.sendVerificationEmail(userData.email, userData.name, status === 'approved' ? 'verify' : 'reject', 'student');
    }

    return { success: true };
  }
}

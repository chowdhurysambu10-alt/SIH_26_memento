import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UserRole } from '../../common/constants/roles.enum';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

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

  async updateProfile(userId: string, updates: Partial<{ name: string; contact: string; district: string }>) {
    const admin = this.supabaseService.getAdminClient();
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

  async verifyUser(targetUserId: string, callerRole: UserRole) {
    if (callerRole !== UserRole.SUPER_ADMIN && callerRole !== UserRole.GOVT_VIEWER) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Only Super Admin or Govt authorities can verify institutional accounts',
        errorCode: 'FORBIDDEN_ACTION',
      });
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('users')
      .update({ verified: true })
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
  async deleteUser(userId: string, callerRole: UserRole) {
    if (callerRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Only Super Admin can delete users',
        errorCode: 'FORBIDDEN_ACTION',
      });
    }

    const admin = this.supabaseService.getAdminClient();
    
    // Attempt to delete from Auth (this usually cascades to public.users if configured)
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    
    // Also explicitly delete from public.users
    const { error: dbError } = await admin
      .from('users')
      .delete()
      .eq('id', userId);

    if (authError && dbError) {
      throw new BadRequestException({
        statusCode: 400,
        message: authError?.message || dbError?.message,
        errorCode: 'USER_DELETE_FAILED',
      });
    }

    return { success: true, message: 'User deleted successfully' };
  }

  async updateUserRole(targetUserId: string, newRole: UserRole, callerRole: UserRole) {
    if (callerRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Only Super Admin can update user roles',
        errorCode: 'FORBIDDEN_ACTION',
      });
    }

    const admin = this.supabaseService.getAdminClient();
    
    // Update public.users
    const { data, error } = await admin
      .from('users')
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'ROLE_UPDATE_FAILED',
      });
    }

    // Update Auth metadata
    await admin.auth.admin.updateUserById(targetUserId, {
      user_metadata: { role: newRole }
    });

    return data;
  }

  async submitVerificationRequest(userId: string, verificationData: any) {
    const admin = this.supabaseService.getAdminClient();
    
    // Store the verification request data in the user_metadata
    const { data, error } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { verification_request: verificationData }
    });

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'VERIFICATION_REQUEST_FAILED',
      });
    }

    return { success: true, message: 'Verification request submitted' };
  }

  async getVerificationRequests() {
    const admin = this.supabaseService.getAdminClient();
    
    // Fetch all users to find those with pending verification requests
    // Using listUsers retrieves up to 50 users by default. We assume small dataset for prototyping.
    const { data, error } = await admin.auth.admin.listUsers();
    
    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'FETCH_REQUESTS_FAILED',
      });
    }

    // Filter users who have a verification_request in their metadata and are NOT yet verified in the public.users table
    // Since listUsers only returns Auth data, we also need to cross-reference public.users to see if they are verified.
    
    const usersWithRequests = data.users.filter((u: any) => u.user_metadata?.verification_request);
    
    if (usersWithRequests.length === 0) return [];

    const userIds = usersWithRequests.map(u => u.id);
    
    const { data: publicUsers } = await admin
      .from('users')
      .select('id, verified, name, email, role')
      .in('id', userIds);

    const pendingRequests = [];
    
    for (const authUser of usersWithRequests as any[]) {
      const publicUser = publicUsers?.find(u => u.id === authUser.id);
      
      // Only return if they are NOT verified
      if (publicUser && !publicUser.verified) {
        pendingRequests.push({
          id: publicUser.id,
          name: publicUser.name,
          email: publicUser.email,
          role: publicUser.role,
          verification_data: authUser.user_metadata.verification_request
        });
      }
    }

    return pendingRequests;
  }
}

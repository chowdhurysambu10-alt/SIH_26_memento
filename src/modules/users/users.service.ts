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
    const { data, error } = await admin
      .from('users')
      .select('*, institutions(id, name, type, location, district)')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'User profile not found',
        errorCode: 'USER_NOT_FOUND',
      });
    }

    return data;
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
}

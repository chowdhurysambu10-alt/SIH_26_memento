import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async signup(dto: SignupDto) {
    const admin = this.supabaseService.getAdminClient();

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true, // auto-confirm for seamless sandbox / demo experience
      user_metadata: {
        name: dto.name,
        role: dto.role,
        district: dto.district,
        org_id: dto.org_id,
      },
    });

    if (authError) {
      this.logger.error(`Failed to create auth user: ${authError.message}`);
      throw new BadRequestException({
        statusCode: 400,
        message: authError.message,
        errorCode: 'AUTH_SIGNUP_FAILED',
      });
    }

    const userId = authData.user.id;

    // 2. Insert into public.users table
    const { error: profileError } = await admin.from('users').upsert({
      id: userId,
      name: dto.name,
      email: dto.email,
      role: dto.role,
      org_id: dto.org_id || null,
      district: dto.district || null,
      contact: dto.contact || null,
      verified: dto.role === 'citizen', // citizens auto-verified, institutional roles require admin verification
    });

    if (profileError) {
      this.logger.error(`Failed to create public user profile: ${profileError.message}`);
      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'User created in auth but profile insertion failed',
        errorCode: 'PROFILE_CREATION_FAILED',
      });
    }

    // 3. Issue session tokens
    const { data: sessionData, error: sessionError } =
      await admin.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

    return {
      user: {
        id: userId,
        email: dto.email,
        name: dto.name,
        role: dto.role,
        org_id: dto.org_id,
        district: dto.district,
        verified: dto.role === 'citizen',
      },
      session: sessionData?.session || null,
    };
  }

  async login(dto: LoginDto) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: error?.message || 'Invalid email or password',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    // Fetch full profile from users table
    const { data: profile } = await admin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name,
        role: profile?.role || data.user.user_metadata?.role,
        org_id: profile?.org_id,
        district: profile?.district,
        verified: profile?.verified,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    };
  }
}

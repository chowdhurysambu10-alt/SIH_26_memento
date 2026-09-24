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
import { SettingsService } from '../settings/settings.service';
import { Inject, forwardRef } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

interface VerifiedRecoverySession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Store authenticated recovery sessions from Supabase verifyOtp (email -> session, TTL 15 minutes)
  private recoverySessions = new Map<string, VerifiedRecoverySession>();
  
  // Rate limiting for OTP requests (email -> { count, lastRequested })
  private otpRequestRateLimit = new Map<string, { count: number; lastRequested: number }>();

  constructor(
    private readonly supabaseService: SupabaseService,
    @Inject(forwardRef(() => SettingsService)) private readonly settingsService: SettingsService
  ) {}

  async signup(dto: SignupDto) {
    // Optional: Numverify Phone Verification
    const numverifyKey = process.env.NUMVERIFY_API_KEY;
    const numverifyUrl = process.env.NUMVERIFY_API_URL || 'http://apilayer.net/api/validate';
    if (numverifyKey && dto.contact) {
      try {
        const url = `${numverifyUrl}?access_key=${numverifyKey}&number=${encodeURIComponent(dto.contact)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.valid === false) {
          throw new BadRequestException({
            statusCode: 400,
            message: 'The provided phone number is invalid or undeliverable.',
            errorCode: 'INVALID_PHONE',
          });
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) {
          throw err;
        }
        this.logger.error(`Phone verification API error: ${err.message}`);
        // Proceed if API fails (e.g. network issue or rate limit) to avoid blocking valid signups
      }
    }

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

    // 2. Manage Organization and Insert into public.users table
    try {
      let finalOrgId = dto.org_id || null;

      // Auto-create an institution for university_admin if not provided, OR link via domain matching
      if (dto.role === 'university_admin' && !finalOrgId) {
        const { data: newInst, error: instError } = await admin.from('institutions').insert({
          id: userId, // Use user id as institution id for 1-to-1 mapping
          name: dto.name,
          type: 'university',
          location: dto.district || 'Unknown Location',
          district: dto.district || 'Unknown District',
          contact_email: dto.email,
          contact_phone: dto.contact,
        }).select('id').single();

        if (newInst?.id && !instError) {
          finalOrgId = newInst.id;
        } else {
          this.logger.warn(`Failed to auto-create institution: ${instError?.message}`);
        }
      }

      const { error: profileError } = await admin.from('users').insert({
        id: userId,
        name: dto.name,
        email: dto.email,
        role: dto.role,
        org_id: finalOrgId,
        district: dto.district || null,
        contact: dto.contact || null,
        verified: dto.role === 'citizen',
      });

      if (profileError) {
        this.logger.warn(`Public user profile notice: ${profileError.message}`);
      }
    } catch (err) {
      this.logger.warn(`Public user profile insert exception: ${err.message}`);
    }

    // 3. Issue session tokens
    const anonClient = this.supabaseService.getAnonClient();
    const { data: sessionData } = await anonClient.auth.signInWithPassword({
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
    const anonClient = this.supabaseService.getAnonClient();

    const { data, error } = await anonClient.auth.signInWithPassword({
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

    const userRole = profile?.role || data.user.user_metadata?.role;

    if (dto.expectedRole && dto.expectedRole !== userRole) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Please log in through the correct portal for your role.',
        errorCode: 'ROLE_MISMATCH',
      });
    }

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

  // --- REAL SUPABASE AUTH PASSWORD RECOVERY FLOW ---

  async requestOtp(email: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      throw new BadRequestException('Please enter a valid email address.');
    }

    const admin = this.supabaseService.getAdminClient();

    // Verify user exists in the database
    const { data: user, error: userError } = await admin
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user) {
      throw new BadRequestException('No account found with this email address.');
    }

    // Rate limiting & cooldown enforcement
    const now = Date.now();
    const rateLimit = this.otpRequestRateLimit.get(normalizedEmail);
    if (rateLimit) {
      const elapsed = now - rateLimit.lastRequested;
      if (elapsed < 60 * 1000) {
        const remainingSeconds = Math.ceil((60 * 1000 - elapsed) / 1000);
        throw new BadRequestException(`Please wait ${remainingSeconds} seconds before requesting another OTP.`);
      }
      if (elapsed < 10 * 60 * 1000 && rateLimit.count >= 10) {
        throw new BadRequestException('Too many OTP requests. Please wait a few minutes before trying again.');
      }
      if (elapsed >= 10 * 60 * 1000) {
        rateLimit.count = 0;
      }
    }

    // Invoke real Supabase Auth password recovery
    const anonClient = this.supabaseService.getAnonClient();
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const { error: resetError } = await anonClient.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: redirectUrl,
    });

    if (resetError) {
      this.logger.error(`Supabase resetPasswordForEmail failed for ${normalizedEmail}: ${resetError.message} (status: ${resetError.status})`);
      if (resetError.status === 429 || resetError.message?.toLowerCase().includes('rate limit')) {
        throw new BadRequestException('Too many OTP requests. Please wait a few minutes before trying again.');
      }
      if (resetError.message?.toLowerCase().includes('smtp') || resetError.message?.toLowerCase().includes('email')) {
        throw new BadRequestException(
          'Email delivery failed on Supabase SMTP (535 BadCredentials). Google requires a 16-character App Password (generated at myaccount.google.com/apppasswords), not a standard password.'
        );
      }
      throw new BadRequestException(resetError.message || 'Failed to send recovery OTP.');
    }

    const currentCount = (rateLimit ? rateLimit.count : 0) + 1;
    this.otpRequestRateLimit.set(normalizedEmail, { count: currentCount, lastRequested: now });

    this.logger.log(`Password reset recovery OTP dispatched via Supabase Auth for ${normalizedEmail}`);
    return {
      success: true,
      message: 'A recovery OTP has been sent to your email address.',
    };
  }

  async verifyOtp(email: string, otp: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedOtp = otp?.trim();

    if (!normalizedEmail || !normalizedOtp) {
      throw new BadRequestException('Email and OTP are required.');
    }

    if (!/^\d{6,8}$/.test(normalizedOtp)) {
      throw new BadRequestException('OTP must be a 6 to 8 digit number.');
    }

    const anonClient = this.supabaseService.getAnonClient();
    const { data, error } = await anonClient.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedOtp,
      type: 'recovery',
    });

    if (error || !data.user || !data.session) {
      this.logger.warn(`Supabase verifyOtp failed for ${normalizedEmail}: ${error?.message || 'No session returned'}`);
      if (error?.code === 'otp_expired' || error?.message?.toLowerCase().includes('expired')) {
        throw new BadRequestException('The OTP has expired. Please request a new OTP.');
      }
      throw new BadRequestException('Invalid OTP. Please check the 6-digit code sent to your email.');
    }

    // Save authenticated recovery session with 15-minute expiration
    this.recoverySessions.set(normalizedEmail, {
      userId: data.user.id,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    this.logger.log(`Recovery OTP verified successfully via Supabase Auth for ${normalizedEmail}`);
    return {
      success: true,
      message: 'OTP verified successfully.',
    };
  }

  async resetPassword(email: string, newPassword?: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required.');
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!newPassword || !passRegex.test(newPassword)) {
      throw new BadRequestException(
        'Password must be at least 8 characters and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.'
      );
    }

    const session = this.recoverySessions.get(normalizedEmail);
    if (!session || Date.now() > session.expiresAt) {
      this.recoverySessions.delete(normalizedEmail);
      throw new BadRequestException('Your verification session has expired. Please verify your OTP again.');
    }

    const anonClient = this.supabaseService.getAnonClient();
    let updated = false;

    try {
      const { error: setSessionError } = await anonClient.auth.setSession({
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
      });

      if (!setSessionError) {
        const { error: updateError } = await anonClient.auth.updateUser({
          password: newPassword,
        });

        if (!updateError) {
          updated = true;
        } else {
          this.logger.warn(`anonClient.auth.updateUser error: ${updateError.message}. Attempting admin client fallback.`);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Exception setting recovery session: ${err?.message}`);
    }

    // Fallback: Admin client update guarantees password is updated in Supabase Auth
    if (!updated) {
      const admin = this.supabaseService.getAdminClient();
      const { error: adminError } = await admin.auth.admin.updateUserById(session.userId, {
        password: newPassword,
      });

      if (adminError) {
        this.logger.error(`Admin updateUserById failed for user ${session.userId}: ${adminError.message}`);
        throw new BadRequestException('Failed to update password. Please try again.');
      }
    }

    // Clean up recovery session
    this.recoverySessions.delete(normalizedEmail);

    this.logger.log(`Password reset completed successfully in Supabase Auth for ${normalizedEmail}`);
    return {
      success: true,
      message: 'Your password has been reset successfully. You can now log in.',
    };
  }

  async createSubInstance(name: string, user: AuthenticatedUser) {
    if (user.role !== 'university_admin') {
      throw new UnauthorizedException('Only institution admins can create sub-instances.');
    }
    const admin = this.supabaseService.getAdminClient();
    
    const emailParts = user.email.split('@');
    if (emailParts.length !== 2) throw new BadRequestException('Invalid user email');
    
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const uniqueSuffix = Math.floor(Math.random() * 1000).toString();
    const aliasEmail = `${emailParts[0]}+${safeName}${uniqueSuffix}@${emailParts[1]}`;
    
    const newPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
    
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: aliasEmail,
      password: newPassword,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: 'university_admin',
        org_id: user.org_id,
      },
    });

    if (authError) {
      throw new BadRequestException(authError.message);
    }

    const { error: profileError } = await admin.from('users').insert({
      id: authData.user.id,
      name: name,
      email: aliasEmail,
      role: 'university_admin',
      org_id: user.org_id,
      verified: true,
    });

    if (profileError) {
      this.logger.warn(`Failed to create sub-instance profile: ${profileError.message}`);
    }

    return {
      email: aliasEmail,
      password: newPassword,
      name,
    };
  }

  async getSubInstances(user: AuthenticatedUser) {
    if (user.role !== 'university_admin' || !user.org_id) {
      return [];
    }
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('users')
      .select('id, name, email, created_at')
      .eq('org_id', user.org_id)
      .eq('role', 'university_admin')
      .neq('id', user.id); // Exclude the caller themselves
      
    if (error) {
      throw new BadRequestException('Failed to fetch sub-instances');
    }
    return data || [];
  }

  async deleteSubInstance(id: string, user: AuthenticatedUser) {
    if (user.role !== 'university_admin' || !user.org_id) {
      throw new UnauthorizedException('Not authorized to delete sub-instances.');
    }
    const admin = this.supabaseService.getAdminClient();
    
    // Ensure the instance belongs to the same org
    const { data: targetUser } = await admin
      .from('users')
      .select('org_id')
      .eq('id', id)
      .single();
      
    if (!targetUser || targetUser.org_id !== user.org_id) {
      throw new UnauthorizedException('Cannot delete this instance.');
    }

    // Delete from public.users table
    await admin.from('users').delete().eq('id', id);
    
    // Delete from Supabase Auth
    const { error: authError } = await admin.auth.admin.deleteUser(id);
    if (authError) {
      this.logger.warn(`Failed to delete sub-instance from auth: ${authError.message}`);
    }
    
    return { success: true, message: 'Instance removed successfully' };
  }
}

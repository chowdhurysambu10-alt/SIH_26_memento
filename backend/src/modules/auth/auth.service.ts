import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { SettingsService } from '../settings/settings.service';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory OTP store (target -> { otp, expiresAt, contact, verified })
  private otpStore = new Map<string, { otp: string; expiresAt: number; contact?: string; verified?: boolean }>();
  
  // Rate limiting for OTP requests per day
  private dailyOtpRequests = new Map<string, { count: number; date: string }>();
  
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

      // Auto-create an institution for university_admin if not provided
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

  // --- OTP VERIFICATION LOGIC ---
  
  private async checkMobileRateLimit(): Promise<void> {
    const filePath = path.join(process.cwd(), 'data', 'otp_limits.json');
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g., "2026-09"
    
    let limits = { month: currentMonth, count: 0 };
    
    try {
      if (fs.existsSync(filePath)) {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);
        if (parsed.month === currentMonth) {
          limits = parsed;
        }
      }
    } catch (err) {
      this.logger.error(`Error reading rate limits: ${err}`);
    }

    if (limits.count >= 100) {
      throw new BadRequestException('For this month your mobile verification feature is blocked. Try using a gmail account or wait till next month 1st day or contact support.');
    }

    limits.count += 1;
    
    try {
      if (!fs.existsSync(path.dirname(filePath))) {
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      }
      await fs.promises.writeFile(filePath, JSON.stringify(limits, null, 2));
    } catch (err) {
      this.logger.error(`Error writing rate limits: ${err}`);
    }
  }

  async requestOtp(email: string, contact?: string) {
    const admin = this.supabaseService.getAdminClient();
    
    const today = new Date().toISOString().slice(0, 10);
    const requestStats = this.dailyOtpRequests.get(email.trim()) || { count: 0, date: today };
    if (requestStats.date !== today) {
      requestStats.count = 0;
      requestStats.date = today;
    }
    if (requestStats.count >= 5) {
      throw new BadRequestException('You have exceeded the maximum limit of 5 OTP requests per day.');
    }
    
    // Check if user exists
    const { data: user, error: userError } = await admin
      .from('users')
      .select('id, email, contact')
      .eq('email', email.trim())
      .single();
      
    if (userError || !user) {
      throw new BadRequestException('No account found with this email address.');
    }
    
    // If contact is provided for mobile verification, apply rate limit and verify
    if (contact) {
      if (user.contact && user.contact !== contact) {
        throw new BadRequestException('Mobile number does not match the registered account. Please check the number or use email verification.');
      }
      await this.checkMobileRateLimit();
    }

    // Generate a secure 6-digit random number
    const otp = crypto.randomInt(100000, 1000000).toString();
    
    // Store in memory for 10 minutes against the USER'S EMAIL
    this.otpStore.set(email.trim(), {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      contact: contact || undefined,
      verified: false,
    });
    
    requestStats.count++;
    this.dailyOtpRequests.set(email.trim(), requestStats);

    if (!contact && process.env.SMTP_USER) {
      const settings = await this.settingsService.getSettings();
      if (!settings.enableEmailService) {
        this.logger.log(`Skipped sending OTP email to ${email} (Email Service Disabled)`);
        return { message: 'OTP flow is skipped because email service is disabled.' };
      }
      // Send email via Nodemailer if no contact is provided (email flow)
      try {
        await this.transporter.sendMail({
          from: `"Memento Support" <${process.env.SMTP_USER}>`,
          to: email.trim(),
          subject: 'Your Password Reset OTP',
          html: `<p>Your Memento OTP for password reset is: <strong>${otp}</strong></p><p>This OTP is valid for 10 minutes.</p>`,
        });
        this.logger.log(`Sent OTP email to ${email}`);
      } catch (err) {
        this.logger.error(`Failed to send OTP email: ${err}`);
        throw new BadRequestException('Failed to send OTP email.');
      }
    } else if (contact) {
      // Logging the mobile OTP (pretend SMS delivery)
      this.logger.log(`Generated OTP for mobile ${contact}: ${otp}`);
    }

    return { success: true, message: `OTP generated for ${contact || email}` };
  }

  async verifyOtp(email: string, otp: string) {
    const record = this.otpStore.get(email.trim());
    
    if (!record) {
      throw new BadRequestException('No OTP request found for this account.');
    }
    
    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(email.trim());
      throw new BadRequestException('OTP has expired.');
    }
    
    if (record.otp !== otp) {
      throw new BadRequestException('Invalid OTP.');
    }
    
    record.verified = true;
    return { success: true, message: 'OTP verified successfully.' };
  }

  async resetPassword(email: string, newPassword?: string) {
    const record = this.otpStore.get(email.trim());
    
    if (!record || !record.verified) {
      throw new BadRequestException('OTP not verified or request expired.');
    }
    
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters.');
    }

    const admin = this.supabaseService.getAdminClient();

    // Find the user ID from the users table first
    const { data: user, error: userError } = await admin
      .from('users')
      .select('id, contact')
      .eq('email', email.trim())
      .single();

    if (userError || !user) {
      throw new BadRequestException('User not found.');
    }

    // Force update the password in Supabase Auth
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      this.logger.error(`Failed to update password for ${email}: ${updateError.message}`);
      throw new BadRequestException('Failed to update password. Please try again.');
    }
    
    // If the reset was done via mobile and it's a new number, store it
    if (record.contact && !user.contact) {
      await admin.from('users').update({ contact: record.contact }).eq('id', user.id);
    }
    
    // Valid OTP and successful update - clean it up
    this.otpStore.delete(email.trim());
    
    return { success: true, message: 'Password has been reset successfully.' };
  }
}

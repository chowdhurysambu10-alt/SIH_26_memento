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
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory OTP store (target -> { otp, expiresAt })
  private otpStore = new Map<string, { otp: string; expiresAt: number }>();
  
  private transporter: nodemailer.Transporter;

  constructor(private readonly supabaseService: SupabaseService) {
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

    // 2. Insert into public.users table
    try {
      const { error: profileError } = await admin.from('users').insert({
        id: userId,
        name: dto.name,
        email: dto.email,
        role: dto.role,
        org_id: dto.org_id || null,
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
    
    // Check if user exists
    const { data: user, error: userError } = await admin
      .from('users')
      .select('id, email')
      .eq('email', email.trim())
      .single();
      
    if (userError || !user) {
      throw new BadRequestException('No account found with this email address.');
    }
    
    // If contact is provided for mobile verification, apply rate limit
    if (contact) {
      // SECURITY WARNING: We are not verifying if this mobile number belongs to the email!
      // This allows anyone to reset any account's password if they have a mobile number.
      // (Implemented as requested by user since mobile numbers aren't stored)
      await this.checkMobileRateLimit();
    }

    // Generate a 6-digit random number
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in memory for 10 minutes against the USER'S EMAIL
    this.otpStore.set(email.trim(), {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    if (!contact && process.env.SMTP_USER) {
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

  async resetPassword(email: string, otp: string, newPassword?: string) {
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
    
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters.');
    }

    const admin = this.supabaseService.getAdminClient();

    // Find the user ID from the users table first
    const { data: user, error: userError } = await admin
      .from('users')
      .select('id')
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
    
    // Valid OTP and successful update - clean it up
    this.otpStore.delete(email.trim());
    
    return { success: true, message: 'Password has been reset successfully.' };
  }
}

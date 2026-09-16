import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user (Citizen, Faculty, Student, Admin, etc.)' })
  @ApiResponse({ status: 201, description: 'User successfully created with assigned role.' })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email & password, receives Supabase JWT session' })
  @ApiResponse({ status: 200, description: 'Authenticated successfully with tokens.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request an OTP for password reset' })
  async requestOtp(@Body() dto: { email: string }) {
    return this.authService.requestOtp(dto.email);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP before password reset' })
  async verifyOtp(@Body() dto: { email: string; otp: string }) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and reset password' })
  async resetPassword(@Body() dto: { email: string; newPassword?: string }) {
    return this.authService.resetPassword(dto.email, dto.newPassword);
  }
}

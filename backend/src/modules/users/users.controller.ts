import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.enum';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get profile of current authenticated user' })
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile details (name, contact, district)' })
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updates: { name?: string; email?: string; contact?: string; district?: string },
  ) {
    return this.usersService.updateProfile(user.id, updates);
  }

  @Patch(':id/verify')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GOVT_VIEWER)
  @ApiOperation({ summary: 'Verify institutional account (Super Admin / Govt only)' })
  async verifyAccount(
    @Param('id') targetId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('action') action: 'verify' | 'reject' | 'reverify' = 'verify',
  ) {
    return this.usersService.verifyUser(targetId, user.role, action);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.GOVT_VIEWER, UserRole.PRI_ULB_OFFICIAL, UserRole.UNIVERSITY_ADMIN)
  @ApiOperation({ summary: 'List all platform users with role/district filters' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  @ApiQuery({ name: 'district', required: false })
  async listUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('role') role?: UserRole,
    @Query('district') district?: string,
  ) {
    // Prevent institutions from fetching all citizens/students
    const safeRole = user.role === UserRole.UNIVERSITY_ADMIN ? UserRole.UNIVERSITY_ADMIN : role;
    return this.usersService.getAllUsers(safeRole, district);
  }

  @Patch(':id/profile')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update any user profile (Super Admin only)' })
  async updateAnyProfile(
    @Param('id') targetId: string,
    @Body() updates: { name?: string; email?: string; contact?: string; district?: string },
  ) {
    return this.usersService.updateProfile(targetId, updates);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a user account (Super Admin only)' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  // --- Student Verifications ---

  @Post('verify')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit student verification documents' })
  async submitVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { institution_name: string; student_id_card_url: string }
  ) {
    return this.usersService.submitStudentVerification(user, dto.institution_name, dto.student_id_card_url);
  }

  @Get('verify/pending')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all pending student verifications' })
  async getPendingVerifications(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getPendingStudentVerifications(user);
  }

  @Patch('verify/:id/status')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve or reject a student verification' })
  async updateVerificationStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: { status: 'approved' | 'rejected' }
  ) {
    return this.usersService.updateStudentVerificationStatus(user, id, dto.status);
  }
}

import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
  Post,
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
    @Body() updates: { name?: string; contact?: string; district?: string },
  ) {
    return this.usersService.updateProfile(user.id, updates);
  }

  @Post('me/verification-request')
  @ApiOperation({ summary: 'Submit a verification request form (Student/Institution)' })
  async submitVerificationRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() verificationData: any,
  ) {
    return this.usersService.submitVerificationRequest(user.id, verificationData);
  }

  @Get('verification-requests')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GOVT_VIEWER)
  @ApiOperation({ summary: 'List all pending verification requests' })
  async getVerificationRequests() {
    return this.usersService.getVerificationRequests();
  }

  @Patch(':id/verify')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GOVT_VIEWER)
  @ApiOperation({ summary: 'Verify institutional account (Super Admin / Govt only)' })
  async verifyAccount(
    @Param('id') targetId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.verifyUser(targetId, user.role);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.GOVT_VIEWER, UserRole.PRI_ULB_OFFICIAL)
  @ApiOperation({ summary: 'List all platform users with role/district filters' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  @ApiQuery({ name: 'district', required: false })
  async listUsers(
    @Query('role') role?: UserRole,
    @Query('district') district?: string,
  ) {
    return this.usersService.getAllUsers(role, district);
  }

  @Patch(':id/role')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user role (Super Admin only)' })
  async updateUserRole(
    @Param('id') targetId: string,
    @Body('role') role: UserRole,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.updateUserRole(targetId, role, user.role);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete user (Super Admin only)' })
  async deleteUser(
    @Param('id') targetId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.deleteUser(targetId, user.role);
  }
}

import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.enum';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications (auto pushed via Supabase Realtime)' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  async getMyNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const isUnreadOnly = unreadOnly === 'true' || unreadOnly === '1';
    return this.notificationsService.getMyNotifications(user.id, isUnreadOnly);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark specific notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete specific notification' })
  async deleteNotification(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.deleteNotification(id, user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all notifications' })
  async deleteAllNotifications(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.deleteAllNotifications(user.id);
  }

  @Post('broadcast')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Broadcast a notification to specific roles or all users' })
  async broadcastNotification(
    @Body() body: { role: string; type: string; payload: Record<string, any> },
  ) {
    return this.notificationsService.broadcastNotification(body.role, body.type, body.payload);
  }
}

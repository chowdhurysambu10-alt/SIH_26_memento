import { Controller, Post, Get, Delete, Body, UseGuards, Param } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('messaging')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('alias')
  @ApiOperation({ summary: 'Generate a temporary mail alias for the current session' })
  async generateAlias(
    @CurrentUser() user: AuthenticatedUser,
    @Body('publicKey') publicKey: string,
  ) {
    if (!publicKey) {
      throw new Error('Public key is required to generate an E2EE alias.');
    }
    return this.messagingService.generateAlias(user, publicKey);
  }

  @Get('alias')
  @ApiOperation({ summary: 'Get the current temporary mail alias' })
  getAlias(@CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.getAlias(user);
  }

  @Delete('alias')
  @ApiOperation({ summary: 'Delete the temporary mail alias and all its messages' })
  async deleteAlias(@CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.deleteAlias(user);
  }

  @Get('public-key/:aliasId')
  async getPublicKey(@Param('aliasId') aliasId: string) {
    return this.messagingService.getPublicKey(aliasId);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send an encrypted message to an alias' })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(user, dto);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Get all encrypted messages for the active alias' })
  getInbox(@CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.getInbox(user);
  }
}

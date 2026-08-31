import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CollaborationService } from './collaboration.service';
import {
  CreateTeamDto,
  AssignMembersDto,
  CreateEngagementDto,
  UpdateEngagementStatusDto,
  CreateMilestoneDto,
  SubmitDeliverableDto,
  ApproveMilestoneDto,
} from './dto/collaboration.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.enum';

@ApiTags('Collaboration')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Post('teams')
  @Roles(UserRole.UNIVERSITY_ADMIN, UserRole.FACULTY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Form a university project team for a routed challenge' })
  async formTeam(
    @Body() dto: CreateTeamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationService.formTeam(dto, user);
  }

  @Patch('teams/:id/members')
  @Roles(UserRole.UNIVERSITY_ADMIN, UserRole.FACULTY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign faculty and student contributors to project team' })
  async assignMembers(
    @Param('id') teamId: string,
    @Body() dto: AssignMembersDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationService.assignMembers(teamId, dto, user);
  }

  @Get('teams/challenge/:challengeId')
  @ApiOperation({ summary: 'Get team details, members, and milestones for a challenge' })
  async getTeamByChallenge(@Param('challengeId') challengeId: string) {
    return this.collaborationService.getTeamByChallenge(challengeId);
  }

  @Post('engagements')
  @Roles(UserRole.INDUSTRY_PARTNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Submit an industry partnership/funding engagement request' })
  async createEngagement(
    @Body() dto: CreateEngagementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationService.createEngagement(dto, user);
  }

  @Patch('engagements/:id/status')
  @Roles(
    UserRole.UNIVERSITY_ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.GOVT_VIEWER,
  )
  @ApiOperation({ summary: 'Accept or decline industry engagement offer' })
  async updateEngagementStatus(
    @Param('id') engagementId: string,
    @Body() dto: UpdateEngagementStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationService.updateEngagementStatus(
      engagementId,
      dto,
      user,
    );
  }

  @Post('milestones')
  @Roles(UserRole.UNIVERSITY_ADMIN, UserRole.FACULTY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create project milestone with timeline and deliverables' })
  async createMilestone(
    @Body() dto: CreateMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationService.createMilestone(dto, user);
  }

  @Patch('milestones/:id/submit')
  @Roles(
    UserRole.FACULTY,
    UserRole.STUDENT,
    UserRole.UNIVERSITY_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Submit deliverable file/link for milestone review' })
  async submitDeliverable(
    @Param('id') milestoneId: string,
    @Body() dto: SubmitDeliverableDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationService.submitDeliverable(milestoneId, dto, user);
  }

  @Patch('milestones/:id/approve')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.GOVT_VIEWER,
    UserRole.UNIVERSITY_ADMIN,
  )
  @ApiOperation({ summary: 'Approve or reject milestone deliverable' })
  async approveMilestone(
    @Param('id') milestoneId: string,
    @Body() dto: ApproveMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collaborationService.approveMilestone(milestoneId, dto, user);
  }
}

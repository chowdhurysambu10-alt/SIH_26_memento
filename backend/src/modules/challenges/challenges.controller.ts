import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { FilterChallengeDto } from './dto/filter-challenge.dto';
import { OverrideRoutingDto } from './dto/override-routing.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.enum';
import { ChallengeStatus } from '../../common/constants/challenge-status.enum';

@ApiTags('Challenges')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Submit a new challenge (with optional image/media file upload and AI classification)',
  })
  async createChallenge(
    @Body() dto: CreateChallengeDto,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.challengesService.createChallenge(dto, user, files);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'List challenges with pagination, filters (category, district, status), and RLS enforcement',
  })
  async getChallenges(
    @Query() filter: FilterChallengeDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: any,
  ) {
    return this.challengesService.getChallenges(filter, user, req.token);
  }

  @Get('top-featured')
  @Public()
  @ApiOperation({
    summary: 'Get the top featured problem (cached in-memory for instant loading)',
  })
  async getTopFeaturedProblem() {
    return this.challengesService.getTopFeaturedProblem();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get details of a single challenge by ID' })
  async getChallengeById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.getChallengeById(id, user);
  }

  @Post(':id/override-routing')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GOVT_VIEWER)
  @ApiOperation({
    summary: 'Override AI routing / category / score (Super Admin or Govt only)',
  })
  async overrideRouting(
    @Param('id') id: string,
    @Body() dto: OverrideRoutingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.overrideRouting(id, dto, user);
  }

  @Post(':id/support')
  @ApiOperation({
    summary: 'Support / Like a challenge to elevate its priority ranking in the feed',
  })
  async toggleSupport(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.toggleSupport(id, user);
  }

  @Patch(':id/status')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.GOVT_VIEWER,
    UserRole.UNIVERSITY_ADMIN,
    UserRole.FACULTY,
  )
  @ApiOperation({
    summary: 'Update challenge status with State Machine Transition Validation',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.updateStatus(id, dto, user);
  }

  // --- TENDER / PROPOSAL SYSTEM ENDPOINTS ---

  @Post(':id/proposals')
  @Roles(UserRole.UNIVERSITY_ADMIN, UserRole.FACULTY)
  @ApiOperation({
    summary: 'Submit a proposal (bid) for a challenge',
  })
  async submitProposal(
    @Param('id') id: string,
    @Body() dto: any, // CreateProposalDto
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.submitProposal(id, dto, user);
  }

  @Get('proposals/my-bids')
  @Roles(UserRole.UNIVERSITY_ADMIN, UserRole.FACULTY)
  @ApiOperation({
    summary: 'Get all proposals submitted by the current institution',
  })
  async getMyProposals(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.getMyProposals(user);
  }

  @Get(':id/proposals')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GOVT_VIEWER)
  @ApiOperation({
    summary: 'List all proposals (bids) for a specific challenge',
  })
  async getChallengeProposals(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.getChallengeProposals(id, user);
  }

  @Patch(':id/proposals/:proposalId/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GOVT_VIEWER)
  @ApiOperation({
    summary: 'Approve a proposal (bid) for a challenge, rejecting others and assigning the institution',
  })
  async approveProposal(
    @Param('id') id: string,
    @Param('proposalId') proposalId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.approveProposal(id, proposalId, user);
  }

  @Patch(':id/proposals/:proposalId/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GOVT_VIEWER)
  @ApiOperation({
    summary: 'Reject a proposal (bid) for a challenge',
  })
  async rejectProposal(
    @Param('id') id: string,
    @Param('proposalId') proposalId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.rejectProposal(id, proposalId, user);
  }

  @Patch(':id/proposals/clean-rejected')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GOVT_VIEWER)
  @ApiOperation({
    summary: 'Clean (delete) all rejected proposals (bids) for a challenge',
  })
  async cleanRejectedBids(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.cleanRejectedBids(id, user);
  }

  @Post('admin/export-archive')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GOVT_VIEWER)
  @ApiOperation({
    summary: 'Export completed challenges to Excel',
  })
  async exportArchiveData(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.exportArchiveData(user);
  }

  @Post('admin/purge-archive')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GOVT_VIEWER)
  @ApiOperation({
    summary: 'Purge exported challenges from database',
  })
  async purgeArchivedChallenges(
    @Body('challengeIds') challengeIds: string[],
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.purgeArchivedChallenges(challengeIds, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update challenge title, description, or allocated institution (Author or Admin)' })
  async updateChallenge(
    @Param('id') id: string,
    @Body() dto: { title?: string; description?: string; assigned_institution_id?: string | null; category_id?: string; status?: ChallengeStatus },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.updateChallenge(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a challenge permanently (Author or Admin)' })
  async deleteChallenge(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.deleteChallenge(id, user);
  }
}

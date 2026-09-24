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

  @Post('validate-image')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Validate an image to detect screenshots or AI-generated imagery using Gemini API',
  })
  async validateImage(@UploadedFile() file: Express.Multer.File) {
    return this.challengesService.validateUploadedImage(file);
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

  @Post(':id/manual-team-member')
  @Roles(UserRole.UNIVERSITY_ADMIN)
  @ApiOperation({
    summary: 'Manually add an offline student to a team (Institution only)',
  })
  async addManualTeamMember(
    @Param('id') id: string,
    @Body() dto: any, // { name, email, contact, role }
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.addManualTeamMember(id, dto, user);
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

  @Patch(':id/vacancy')
  @Roles(UserRole.UNIVERSITY_ADMIN, UserRole.FACULTY)
  @ApiOperation({
    summary: 'Release or close vacancies for students to apply to this assigned problem',
  })
  async releaseVacancy(
    @Param('id') id: string,
    @Body() dto: { vacancies_released: boolean },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.releaseVacancy(id, dto.vacancies_released, user);
  }

  // --- STUDENT APPLICATIONS ENDPOINTS ---

  @Get('my-applications')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Get all applications submitted by the current student',
  })
  async getMyApplications(@CurrentUser() user: AuthenticatedUser) {
    return this.challengesService.getStudentApplications(user.id);
  }

  @Get('institution/applications')
  @Roles(UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.FACULTY)
  @ApiOperation({
    summary: 'Get all student applications for challenges assigned to an institution',
  })
  async getInstitutionApplications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('institutionId') institutionId?: string,
  ) {
    return this.challengesService.getInstitutionApplications(user, institutionId);
  }

  @Patch('applications/:id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.FACULTY)
  @ApiOperation({
    summary: 'Update student application status (approved, rejected, pending)',
  })
  async updateApplicationStatus(
    @Param('id') id: string,
    @Body() dto: { status: 'approved' | 'rejected' | 'pending' | 'waitlisted'; appRole?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.updateApplicationStatus(id, dto.status, user, dto.appRole);
  }

  @Post(':id/apply')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Submit a student application to a project',
  })
  async applyToChallenge(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.applyToChallenge(id, dto, user);
  }

  @Post(':id/offer')
  @Roles(UserRole.UNIVERSITY_ADMIN, UserRole.FACULTY)
  @ApiOperation({
    summary: 'Send a direct offer to a student for a project',
  })
  async sendDirectOffer(
    @Param('id') id: string,
    @Body() dto: { studentEmail: string; role: string; message: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.sendDirectOffer(id, dto, user);
  }

  @Get(':id/applications')
  @Roles(UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.FACULTY)
  @ApiOperation({
    summary: 'Get all student applications for a project',
  })
  async getChallengeApplications(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.getChallengeApplications(id, user);
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

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get details of a single challenge by ID' })
  async getChallengeById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.getChallengeById(id, user);
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

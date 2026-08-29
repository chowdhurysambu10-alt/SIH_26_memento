import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateTeamDto,
  AssignMembersDto,
  CreateEngagementDto,
  UpdateEngagementStatusDto,
  CreateMilestoneDto,
  SubmitDeliverableDto,
  ApproveMilestoneDto,
} from './dto/collaboration.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.enum';
import { ChallengeStatus, MilestoneStatus, ApprovalStatus } from '../../common/constants/challenge-status.enum';
import { ChallengeStateMachine } from '../../common/state-machine/challenge-state-machine';

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 1. Form a project team for a challenge.
   */
  async formTeam(dto: CreateTeamDto, user: AuthenticatedUser) {
    const admin = this.supabaseService.getAdminClient();

    // Verify challenge exists and its current status
    const { data: challenge, error: chError } = await admin
      .from('challenges')
      .select('*')
      .eq('id', dto.challenge_id)
      .single();

    if (chError || !challenge) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Challenge not found',
        errorCode: 'CHALLENGE_NOT_FOUND',
      });
    }

    // Role check: University Admin, Faculty of that university, or Super Admin
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.GOVT_VIEWER &&
      user.org_id !== dto.university_id
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'You can only form teams for your own institution',
        errorCode: 'FORBIDDEN_INSTITUTION',
      });
    }

    // Insert Team
    const { data: team, error: teamError } = await admin
      .from('project_teams')
      .insert({
        challenge_id: dto.challenge_id,
        university_id: dto.university_id,
        faculty_ids: dto.faculty_ids || [],
        student_ids: dto.student_ids || [],
        status: 'active',
      })
      .select('*, institutions(name, district)')
      .single();

    if (teamError) {
      throw new BadRequestException({
        statusCode: 400,
        message: teamError.message,
        errorCode: 'TEAM_FORMATION_FAILED',
      });
    }

    // Transition challenge status to 'team_formed' if currently 'routed'
    if (challenge.status === ChallengeStatus.ROUTED || challenge.status === ChallengeStatus.SUBMITTED) {
      ChallengeStateMachine.assertValidTransition(
        challenge.status as ChallengeStatus,
        ChallengeStatus.TEAM_FORMED,
        user.role,
      );

      await admin
        .from('challenges')
        .update({
          status: ChallengeStatus.TEAM_FORMED,
          assigned_institution_id: dto.university_id,
        })
        .eq('id', dto.challenge_id);
    }

    return team;
  }

  /**
   * 2. Assign faculty and students to team.
   */
  async assignMembers(teamId: string, dto: AssignMembersDto, user: AuthenticatedUser) {
    const admin = this.supabaseService.getAdminClient();

    const { data: existingTeam } = await admin
      .from('project_teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (!existingTeam) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Team not found',
        errorCode: 'TEAM_NOT_FOUND',
      });
    }

    const updates: Record<string, any> = {};
    if (dto.faculty_ids) updates.faculty_ids = dto.faculty_ids;
    if (dto.student_ids) updates.student_ids = dto.student_ids;

    const { data: updated, error } = await admin
      .from('project_teams')
      .update(updates)
      .eq('id', teamId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'ASSIGN_MEMBERS_FAILED',
      });
    }

    return updated;
  }

  /**
   * 3. Get team for a challenge.
   */
  async getTeamByChallenge(challengeId: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('project_teams')
      .select('*, institutions(name, location, district), milestones(*)')
      .eq('challenge_id', challengeId);

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'TEAM_FETCH_FAILED',
      });
    }

    return data;
  }

  /**
   * 4. Create Industry Engagement proposal.
   */
  async createEngagement(dto: CreateEngagementDto, user: AuthenticatedUser) {
    const admin = this.supabaseService.getAdminClient();

    if (!user.org_id && user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'User must be associated with an industry organization',
        errorCode: 'NO_ORG_ASSOCIATION',
      });
    }

    const industryId = user.org_id;

    const { data, error } = await admin
      .from('industry_engagements')
      .insert({
        challenge_id: dto.challenge_id,
        industry_id: industryId,
        engagement_type: dto.engagement_type,
        proposal_notes: dto.proposal_notes || null,
        status: 'pending',
      })
      .select('*, institutions(name)')
      .single();

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'ENGAGEMENT_CREATION_FAILED',
      });
    }

    return data;
  }

  /**
   * 5. Update engagement status (accept/decline).
   */
  async updateEngagementStatus(
    engagementId: string,
    dto: UpdateEngagementStatusDto,
    user: AuthenticatedUser,
  ) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('industry_engagements')
      .update({ status: dto.status })
      .eq('id', engagementId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'ENGAGEMENT_STATUS_UPDATE_FAILED',
      });
    }

    return data;
  }

  /**
   * 6. Create Milestone for Project Team.
   */
  async createMilestone(dto: CreateMilestoneDto, user: AuthenticatedUser) {
    const admin = this.supabaseService.getAdminClient();

    // Verify project exists
    const { data: team, error: teamErr } = await admin
      .from('project_teams')
      .select('*, challenges(*)')
      .eq('id', dto.project_id)
      .single();

    if (teamErr || !team) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Project team not found',
        errorCode: 'PROJECT_NOT_FOUND',
      });
    }

    const { data: milestone, error: mError } = await admin
      .from('milestones')
      .insert({
        project_id: dto.project_id,
        title: dto.title,
        description: dto.description || null,
        due_date: dto.due_date ? new Date(dto.due_date).toISOString() : null,
        status: MilestoneStatus.IN_PROGRESS,
        approval_status: ApprovalStatus.PENDING,
      })
      .select()
      .single();

    if (mError) {
      throw new BadRequestException({
        statusCode: 400,
        message: mError.message,
        errorCode: 'MILESTONE_CREATION_FAILED',
      });
    }

    // Automatically transition challenge to 'in_progress' if currently 'team_formed'
    if (team.challenges?.status === ChallengeStatus.TEAM_FORMED) {
      await admin
        .from('challenges')
        .update({ status: ChallengeStatus.IN_PROGRESS })
        .eq('id', team.challenge_id);
    }

    return milestone;
  }

  /**
   * 7. Submit Milestone Deliverable.
   */
  async submitDeliverable(
    milestoneId: string,
    dto: SubmitDeliverableDto,
    user: AuthenticatedUser,
  ) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('milestones')
      .update({
        deliverable_url: dto.deliverable_url,
        status: MilestoneStatus.SUBMITTED,
        approval_status: ApprovalStatus.PENDING,
      })
      .eq('id', milestoneId)
      .select('*, project_teams(challenge_id)')
      .single();

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'DELIVERABLE_SUBMISSION_FAILED',
      });
    }

    return data;
  }

  /**
   * 8. Approve or Reject Milestone.
   */
  async approveMilestone(
    milestoneId: string,
    dto: ApproveMilestoneDto,
    user: AuthenticatedUser,
  ) {
    const admin = this.supabaseService.getAdminClient();

    const newMilestoneStatus =
      dto.approval_status === ApprovalStatus.APPROVED
        ? MilestoneStatus.COMPLETED
        : MilestoneStatus.IN_PROGRESS;

    const { data: updatedMilestone, error } = await admin
      .from('milestones')
      .update({
        approval_status: dto.approval_status,
        status: newMilestoneStatus,
        approved_by: user.id,
        approval_notes: dto.approval_notes || null,
      })
      .eq('id', milestoneId)
      .select('*, project_teams(challenge_id, id)')
      .single();

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'MILESTONE_APPROVAL_FAILED',
      });
    }

    // Check if all milestones for this project are completed
    if (dto.approval_status === ApprovalStatus.APPROVED && updatedMilestone?.project_teams?.challenge_id) {
      const { data: allMilestones } = await admin
        .from('milestones')
        .select('id, status, approval_status')
        .eq('project_id', updatedMilestone.project_id);

      const allCompleted = allMilestones?.every(
        (m) => m.approval_status === ApprovalStatus.APPROVED && m.status === MilestoneStatus.COMPLETED,
      );

      if (allCompleted && allMilestones && allMilestones.length > 0) {
        // Transition challenge to completed!
        await admin
          .from('challenges')
          .update({ status: ChallengeStatus.COMPLETED })
          .eq('id', updatedMilestone.project_teams.challenge_id);
      }
    }

    return updatedMilestone;
  }
}

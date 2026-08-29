import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ClassificationService } from '../ai/classification.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { FilterChallengeDto } from './dto/filter-challenge.dto';
import { OverrideRoutingDto } from './dto/override-routing.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ChallengeStatus } from '../../common/constants/challenge-status.enum';
import { ChallengeStateMachine } from '../../common/state-machine/challenge-state-machine';
import { UserRole } from '../../common/constants/roles.enum';

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly classificationService: ClassificationService,
  ) {}

  /**
   * Create challenge with AI classification & auto-routing.
   */
  async createChallenge(
    dto: CreateChallengeDto,
    user: AuthenticatedUser,
    file?: Express.Multer.File,
  ) {
    const admin = this.supabaseService.getAdminClient();
    const mediaUrls = [...(dto.media_urls || [])];

    // 1. If file uploaded, store in Supabase Storage
    if (file) {
      try {
        const uploadRes = await this.supabaseService.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
        );
        mediaUrls.push(uploadRes.url);
      } catch (err) {
        this.logger.warn(`File upload failed: ${err.message}`);
      }
    }

    // 2. Run AI Classification & Duplicate Detection
    const { classification, matchedInstitutionId, providerUsed } =
      await this.classificationService.processChallenge(
        dto.title,
        dto.description,
        dto.district,
      );

    // 3. Resolve Category ID from slug
    const { data: category } = await admin
      .from('categories')
      .select('id, name')
      .eq('slug', classification.categorySlug)
      .single();

    const categoryId = category?.id || null;

    // 4. Determine initial status: If institution matched, move to 'routed', else 'submitted'
    const initialStatus = matchedInstitutionId
      ? ChallengeStatus.ROUTED
      : ChallengeStatus.SUBMITTED;

    // 5. Insert challenge record
    const { data: challenge, error } = await admin
      .from('challenges')
      .insert({
        submitted_by: user.id,
        title: dto.title,
        description: dto.description,
        district: dto.district,
        location_text: dto.location_text || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        media_urls: mediaUrls,
        category_id: categoryId,
        priority_score: classification.priorityScore,
        duplicate_of:
          classification.duplicateSimilarityScore >= 0.70
            ? classification.duplicateCandidateId
            : null,
        assigned_institution_id: matchedInstitutionId,
        status: initialStatus,
        ai_classification: {
          ...classification,
          providerUsed,
          processedAt: new Date().toISOString(),
        },
      })
      .select('*, categories(name, slug), institutions(name, district)')
      .single();

    if (error) {
      this.logger.error(`Failed to insert challenge: ${error.message}`);
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'CHALLENGE_CREATION_FAILED',
      });
    }

    // 6. Notify assigned institution admins if routed
    if (matchedInstitutionId) {
      await this.notifyInstitution(matchedInstitutionId, challenge);
    }

    return challenge;
  }

  /**
   * Fetch challenges with filters, search, and pagination.
   */
  async getChallenges(filter: FilterChallengeDto, user: AuthenticatedUser, token?: string) {
    // If user is regular citizen/student/faculty, use userClient to enforce RLS
    // If admin or govt, admin client can be used
    const client =
      user.role === UserRole.SUPER_ADMIN || user.role === UserRole.GOVT_VIEWER || !token
        ? this.supabaseService.getAdminClient()
        : this.supabaseService.getUserClient(token);

    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const offset = (page - 1) * limit;

    let query = client
      .from('challenges')
      .select(
        '*, categories(id, name, slug), institutions(id, name, type, district), users:submitted_by(id, name, email)',
        { count: 'exact' },
      );

    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.district) {
      query = query.eq('district', filter.district);
    }
    if (filter.category_id) {
      query = query.eq('category_id', filter.category_id);
    }
    if (filter.institution_id) {
      query = query.eq('assigned_institution_id', filter.institution_id);
    }
    if (filter.search) {
      query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
    }

    // Citizen specific filtering fallback if RLS client not passed
    if (user.role === UserRole.CITIZEN && (!token || client === this.supabaseService.getAdminClient())) {
      query = query.eq('submitted_by', user.id);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`Error querying challenges: ${error.message}`);
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'CHALLENGES_QUERY_FAILED',
      });
    }

    return {
      data,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get single challenge by ID.
   */
  async getChallengeById(id: string, user: AuthenticatedUser) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('challenges')
      .select(
        '*, categories(id, name, slug), institutions(id, name, type, domain_expertise, district), users:submitted_by(id, name, email, role), project_teams(*, institutions(name)), industry_engagements(*, institutions(name))',
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Challenge with ID '${id}' not found`,
        errorCode: 'CHALLENGE_NOT_FOUND',
      });
    }

    return data;
  }

  /**
   * Super Admin / Govt Override for AI Routing.
   */
  async overrideRouting(
    id: string,
    dto: OverrideRoutingDto,
    user: AuthenticatedUser,
  ) {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.GOVT_VIEWER) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Only Super Admins or Government Viewers can override routing',
        errorCode: 'FORBIDDEN_OVERRIDE',
      });
    }

    const admin = this.supabaseService.getAdminClient();

    // Check challenge exists
    const existing = await this.getChallengeById(id, user);

    const updatePayload: Record<string, any> = {
      ai_classification: {
        ...existing.ai_classification,
        adminOverride: {
          overriddenBy: user.id,
          reason: dto.override_reason,
          at: new Date().toISOString(),
        },
      },
    };

    if (dto.category_id) updatePayload.category_id = dto.category_id;
    if (dto.assigned_institution_id) updatePayload.assigned_institution_id = dto.assigned_institution_id;
    if (dto.priority_score) updatePayload.priority_score = dto.priority_score;

    if (dto.assigned_institution_id && existing.status === ChallengeStatus.SUBMITTED) {
      updatePayload.status = ChallengeStatus.ROUTED;
    }

    const { data, error } = await admin
      .from('challenges')
      .update(updatePayload)
      .eq('id', id)
      .select('*, categories(name), institutions(name)')
      .single();

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'OVERRIDE_FAILED',
      });
    }

    return data;
  }

  /**
   * Update challenge status with State Machine Transition Validation.
   */
  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    user: AuthenticatedUser,
  ) {
    const admin = this.supabaseService.getAdminClient();
    const existing = await this.getChallengeById(id, user);

    const currentStatus = existing.status as ChallengeStatus;
    const targetStatus = dto.status;

    // Validate transition via state machine
    ChallengeStateMachine.assertValidTransition(currentStatus, targetStatus, user.role);

    const { data, error } = await admin
      .from('challenges')
      .update({
        status: targetStatus,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        errorCode: 'STATUS_UPDATE_FAILED',
      });
    }

    return data;
  }

  private async notifyInstitution(institutionId: string, challenge: any) {
    try {
      const admin = this.supabaseService.getAdminClient();
      const { data: admins } = await admin
        .from('users')
        .select('id')
        .eq('org_id', institutionId)
        .eq('role', UserRole.UNIVERSITY_ADMIN);

      if (admins && admins.length > 0) {
        const notifications = admins.map((adm) => ({
          recipient_id: adm.id,
          type: 'challenge_routed',
          payload: {
            challenge_id: challenge.id,
            title: challenge.title,
            priority_score: challenge.priority_score,
            district: challenge.district,
          },
        }));

        await admin.from('notifications').insert(notifications);
      }
    } catch (err) {
      this.logger.warn(`Could not dispatch notification: ${err.message}`);
    }
  }
}

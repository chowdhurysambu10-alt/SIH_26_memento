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
    let categoryId: string | null = null;
    try {
      const { data: category } = await admin
        .from('categories')
        .select('id, name')
        .eq('slug', classification.categorySlug)
        .maybeSingle();
      categoryId = category?.id || null;
    } catch (e) {
      // fallback
    }

    // 4. Ensure user exists in public.users to satisfy foreign key constraint
    try {
      await admin.from('users').upsert({
        id: user.id,
        name: user.name || 'Citizen User',
        email: user.email || `${user.id}@memento.gov.in`,
        role: user.role || UserRole.CITIZEN,
        district: user.district || dto.district || 'Ranchi',
        verified: true,
      }, { onConflict: 'id' });
    } catch (uErr) {
      this.logger.warn(`Notice ensuring user profile in public.users: ${uErr.message}`);
    }

    const initialStatus = ChallengeStatus.SUBMITTED;

    // 5. Insert challenge record
    const { data: challenge, error } = await admin
      .from('challenges')
      .insert({
        submitted_by: user.id,
        user_id: user.id,
        title: dto.title,
        description: dto.description,
        district: dto.district,
        location_text: dto.location_text || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        media_urls: mediaUrls,
        category_id: categoryId,
        category: classification.categoryName || 'Water & Sanitation',
        priority_score: classification.priorityScore,
        ai_summary: classification.rationale || `${dto.title} in ${dto.district}`,
        ai_confidence: 0.88,
        model_used: providerUsed || 'gemma-2',
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
      .select('id, title, description, district, category, status, priority_score, submitted_by, user_id, category_id, assigned_institution_id, created_at')
      .maybeSingle();

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
  async getChallenges(filter: FilterChallengeDto, user?: AuthenticatedUser, token?: string) {
    const client = this.supabaseService.getAdminClient();

    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const offset = (page - 1) * limit;

    let query = client
      .from('challenges')
      .select(
        'id, title, description, district, category, status, priority_score, support_count, media_urls, created_at, submitted_by, category_id, assigned_institution_id, categories(id, name, slug), institutions(id, name, type, district)',
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

    if (user && user.role === UserRole.CITIZEN) {
      query = query.eq('submitted_by', user.id);
    }

    if (filter.sort_by === 'priority') {
      query = query
        .order('priority_score', { ascending: false, nullsFirst: false })
        .order('support_count', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
    } else if (filter.sort_by === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else {
      // Default: Most supported on top, followed by priority and recency
      query = query
        .order('support_count', { ascending: false, nullsFirst: false })
        .order('priority_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
    }

    const result = await query.range(offset, offset + limit - 1);

    let data: any = result.data;
    let count: number = result.count || 0;

    if (result.error) {
      this.logger.warn(`Primary query notice: ${result.error.message}. Executing direct column select...`);
      let fallback = client
        .from('challenges')
        .select('id, title, description, district, category, status, priority_score, support_count, media_urls, created_at, submitted_by, category_id, assigned_institution_id');
      
      if (filter.sort_by === 'priority') {
        fallback = fallback
          .order('priority_score', { ascending: false, nullsFirst: false })
          .order('support_count', { ascending: false, nullsFirst: false });
      } else if (filter.sort_by === 'recent') {
        fallback = fallback.order('created_at', { ascending: false });
      } else {
        fallback = fallback
          .order('support_count', { ascending: false, nullsFirst: false })
          .order('priority_score', { ascending: false, nullsFirst: false });
      }

      const fallbackQuery = await fallback.range(offset, offset + limit - 1);
      data = fallbackQuery.data || [];
      count = data.length;
    }

    const challengeList = data || [];

    // Annotate user support status if user is logged in
    if (user && user.id && challengeList.length > 0) {
      try {
        const challengeIds = challengeList.map((c: any) => c.id);
        const { data: userSupports } = await client
          .from('challenge_supports')
          .select('challenge_id')
          .eq('user_id', user.id)
          .in('challenge_id', challengeIds);

        const supportedSet = new Set((userSupports || []).map((s: any) => s.challenge_id));
        challengeList.forEach((c: any) => {
          c.is_supported = supportedSet.has(c.id);
        });
      } catch (e) {
        // fallback
      }
    }

    return {
      data: challengeList,
      meta: {
        total: count || challengeList.length,
        page,
        limit,
        totalPages: Math.ceil(((count || challengeList.length)) / limit) || 1,
      },
    };
  }

  /**
   * Toggle support / upvote on a challenge (1 vote per user max, un-likes on second click).
   */
  async toggleSupport(id: string, user: AuthenticatedUser) {
    const admin = this.supabaseService.getAdminClient();

    // 1. Fetch current challenge
    const { data: challenge, error } = await admin
      .from('challenges')
      .select('id, support_count')
      .eq('id', id)
      .maybeSingle();

    if (error || !challenge) {
      throw new NotFoundException(`Challenge '${id}' not found`);
    }

    const currentCount = Number(challenge.support_count) || 0;

    // 2. Check if user already supported this challenge
    let existingSupport: any = null;
    try {
      const checkRes = await admin
        .from('challenge_supports')
        .select('id')
        .eq('challenge_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      existingSupport = checkRes.data;
    } catch (checkErr) {
      this.logger.warn(`Notice checking challenge_supports: ${checkErr.message}`);
    }

    let isSupported = false;
    let newCount = currentCount;

    if (existingSupport) {
      // User already supported -> UN-SUPPORT (Toggle OFF)
      try {
        await admin
          .from('challenge_supports')
          .delete()
          .eq('id', existingSupport.id);
      } catch (delErr) {
        this.logger.warn(`Notice deleting support: ${delErr.message}`);
      }

      newCount = Math.max(0, currentCount - 1);
      isSupported = false;
    } else {
      // User hasn't supported -> ADD SUPPORT (Toggle ON)
      try {
        await admin
          .from('challenge_supports')
          .insert({
            challenge_id: id,
            user_id: user.id,
          });
      } catch (insErr) {
        this.logger.warn(`Notice recording support: ${insErr.message}`);
      }

      newCount = currentCount + 1;
      isSupported = true;
    }

    // 3. Persist new support count in challenges table
    const { data: updated } = await admin
      .from('challenges')
      .update({ support_count: newCount })
      .eq('id', id)
      .select('id, support_count')
      .single();

    return {
      challenge_id: id,
      support_count: updated ? updated.support_count : newCount,
      is_supported: isSupported,
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
      const { data: admins, error } = await admin
        .from('users')
        .select('id')
        .eq('org_id', institutionId)
        .eq('role', UserRole.UNIVERSITY_ADMIN);

      if (!error && admins && admins.length > 0) {
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

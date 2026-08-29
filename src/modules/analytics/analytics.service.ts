import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getOverview() {
    const admin = this.supabaseService.getAdminClient();

    const [
      { count: totalChallenges },
      { count: totalUsers },
      { count: totalInstitutions },
      { count: totalTeams },
      { count: totalMilestones },
      { data: challenges },
      { data: categories },
    ] = await Promise.all([
      admin.from('challenges').select('*', { count: 'exact', head: true }),
      admin.from('users').select('*', { count: 'exact', head: true }),
      admin.from('institutions').select('*', { count: 'exact', head: true }),
      admin.from('project_teams').select('*', { count: 'exact', head: true }),
      admin.from('milestones').select('*', { count: 'exact', head: true }),
      admin.from('challenges').select('status, district, category_id, priority_score'),
      admin.from('categories').select('id, name, slug'),
    ]);

    // Compute status counts
    const statusBreakdown: Record<string, number> = {};
    const districtBreakdown: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};

    challenges?.forEach((c) => {
      statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1;
      if (c.district) {
        districtBreakdown[c.district] = (districtBreakdown[c.district] || 0) + 1;
      }
      if (c.category_id) {
        const cat = categories?.find((catItem) => catItem.id === c.category_id);
        const catName = cat ? cat.name : 'Unknown';
        categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + 1;
      }
    });

    return {
      totals: {
        challenges: totalChallenges || 0,
        users: totalUsers || 0,
        institutions: totalInstitutions || 0,
        activeTeams: totalTeams || 0,
        milestones: totalMilestones || 0,
      },
      statusBreakdown,
      districtBreakdown,
      categoryBreakdown,
    };
  }

  async getCategoryBreakdown() {
    const admin = this.supabaseService.getAdminClient();
    const { data: categories } = await admin.from('categories').select('id, name, slug');
    const { data: challenges } = await admin.from('challenges').select('category_id, status, priority_score');

    return categories?.map((cat) => {
      const catChallenges = challenges?.filter((c) => c.category_id === cat.id) || [];
      const completed = catChallenges.filter((c) => c.status === 'completed' || c.status === 'validated').length;
      const inProgress = catChallenges.filter((c) => c.status === 'in_progress' || c.status === 'team_formed').length;
      const avgPriority =
        catChallenges.length > 0
          ? catChallenges.reduce((acc, curr) => acc + (Number(curr.priority_score) || 0), 0) /
            catChallenges.length
          : 0;

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        total: catChallenges.length,
        inProgress,
        completed,
        averagePriorityScore: parseFloat(avgPriority.toFixed(1)),
      };
    });
  }

  async getDistrictBreakdown() {
    const admin = this.supabaseService.getAdminClient();
    const { data: challenges } = await admin.from('challenges').select('district, status, priority_score');

    const districtMap: Record<
      string,
      { district: string; total: number; resolved: number; active: number }
    > = {};

    challenges?.forEach((c) => {
      const d = c.district || 'Unspecified';
      if (!districtMap[d]) {
        districtMap[d] = { district: d, total: 0, resolved: 0, active: 0 };
      }
      districtMap[d].total++;
      if (c.status === 'completed' || c.status === 'validated') {
        districtMap[d].resolved++;
      } else {
        districtMap[d].active++;
      }
    });

    return Object.values(districtMap).sort((a, b) => b.total - a.total);
  }

  async getInstitutionLeaderboard() {
    const admin = this.supabaseService.getAdminClient();
    const { data: institutions } = await admin
      .from('institutions')
      .select('id, name, type, district, domain_expertise');

    const { data: teams } = await admin.from('project_teams').select('university_id, status, milestones(status)');
    const { data: challenges } = await admin.from('challenges').select('assigned_institution_id, status');

    return institutions?.map((inst) => {
      const assignedChallenges = challenges?.filter((c) => c.assigned_institution_id === inst.id) || [];
      const instTeams = teams?.filter((t) => t.university_id === inst.id) || [];
      
      let completedMilestones = 0;
      instTeams.forEach((t: any) => {
        t.milestones?.forEach((m: any) => {
          if (m.status === 'completed') completedMilestones++;
        });
      });

      return {
        id: inst.id,
        name: inst.name,
        type: inst.type,
        district: inst.district,
        domainExpertise: inst.domain_expertise,
        totalAssignedChallenges: assignedChallenges.length,
        activeTeamsCount: instTeams.length,
        completedMilestones,
      };
    });
  }
}

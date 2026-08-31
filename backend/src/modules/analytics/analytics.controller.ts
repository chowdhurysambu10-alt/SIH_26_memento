import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Get('overview')
  @ApiOperation({ summary: 'High-level dashboard overview metrics and counts' })
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Public()
  @Get('by-category')
  @ApiOperation({ summary: 'Challenge counts and resolution rates grouped by category' })
  async getCategoryBreakdown() {
    return this.analyticsService.getCategoryBreakdown();
  }

  @Public()
  @Get('by-district')
  @ApiOperation({ summary: 'Jharkhand district-level challenge heatmap metrics' })
  async getDistrictBreakdown() {
    return this.analyticsService.getDistrictBreakdown();
  }

  @Public()
  @Get('institutions')
  @ApiOperation({ summary: 'Participating universities and industry partner leaderboard' })
  async getInstitutionLeaderboard() {
    return this.analyticsService.getInstitutionLeaderboard();
  }
}

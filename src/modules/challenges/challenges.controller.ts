import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { FilterChallengeDto } from './dto/filter-challenge.dto';
import { OverrideRoutingDto } from './dto/override-routing.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.enum';

@ApiTags('Challenges')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Submit a new challenge (with optional image/media file upload and AI classification)',
  })
  async createChallenge(
    @Body() dto: CreateChallengeDto,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.challengesService.createChallenge(dto, user, file);
  }

  @Get()
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

  @Get(':id')
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
}

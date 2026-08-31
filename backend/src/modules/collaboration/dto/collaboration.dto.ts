import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { IndustryEngagementType, EngagementStatus } from '../../../common/constants/institution-type.enum';
import { ApprovalStatus } from '../../../common/constants/challenge-status.enum';

export class CreateTeamDto {
  @ApiProperty({ example: 'c1000000-0000-0000-0000-000000000001' })
  @IsUUID()
  @IsNotEmpty()
  challenge_id: string;

  @ApiProperty({ example: 'a1000000-0000-0000-0000-000000000001' })
  @IsUUID()
  @IsNotEmpty()
  university_id: string;

  @ApiPropertyOptional({ example: ['e1000000-0000-0000-0000-000000000001'] })
  @IsOptional()
  @IsArray()
  faculty_ids?: string[];

  @ApiPropertyOptional({ example: ['e1000000-0000-0000-0000-000000000002'] })
  @IsOptional()
  @IsArray()
  student_ids?: string[];
}

export class AssignMembersDto {
  @ApiPropertyOptional({ example: ['e1000000-0000-0000-0000-000000000001'] })
  @IsOptional()
  @IsArray()
  faculty_ids?: string[];

  @ApiPropertyOptional({ example: ['e1000000-0000-0000-0000-000000000002'] })
  @IsOptional()
  @IsArray()
  student_ids?: string[];
}

export class CreateEngagementDto {
  @ApiProperty({ example: 'c1000000-0000-0000-0000-000000000001' })
  @IsUUID()
  @IsNotEmpty()
  challenge_id: string;

  @ApiProperty({ enum: IndustryEngagementType, example: IndustryEngagementType.FUNDING })
  @IsEnum(IndustryEngagementType)
  @IsNotEmpty()
  engagement_type: IndustryEngagementType;

  @ApiPropertyOptional({ example: 'Tata Steel CSR offering Rs 5 Lakhs for pilot water filtration units.' })
  @IsOptional()
  @IsString()
  proposal_notes?: string;
}

export class UpdateEngagementStatusDto {
  @ApiProperty({ enum: EngagementStatus, example: EngagementStatus.ACCEPTED })
  @IsEnum(EngagementStatus)
  @IsNotEmpty()
  status: EngagementStatus;
}

export class CreateMilestoneDto {
  @ApiProperty({ example: 'f1000000-0000-0000-0000-000000000001' })
  @IsUUID()
  @IsNotEmpty()
  project_id: string;

  @ApiProperty({ example: 'Milestone 1: Water Sample Collection & Lab Chemical Analysis' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Collect 50 groundwater samples across Dumka block.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-09-30T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  due_date?: string;
}

export class SubmitDeliverableDto {
  @ApiProperty({
    example: 'https://demo.supabase.co/storage/v1/object/public/challenge-media/dumka_water_report.pdf',
    description: 'URL of the submitted report, model, or prototype repository',
  })
  @IsString()
  @IsNotEmpty()
  deliverable_url: string;
}

export class ApproveMilestoneDto {
  @ApiProperty({ enum: ApprovalStatus, example: ApprovalStatus.APPROVED })
  @IsEnum(ApprovalStatus)
  @IsNotEmpty()
  approval_status: ApprovalStatus;

  @ApiPropertyOptional({ example: 'Report verified. Arsenic filtration method validated by department committee.' })
  @IsOptional()
  @IsString()
  approval_notes?: string;
}

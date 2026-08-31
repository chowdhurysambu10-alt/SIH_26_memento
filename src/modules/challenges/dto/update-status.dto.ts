import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ChallengeStatus } from '../../../common/constants/challenge-status.enum';

export class UpdateStatusDto {
  @ApiProperty({ enum: ChallengeStatus, example: ChallengeStatus.IN_PROGRESS })
  @IsEnum(ChallengeStatus)
  @IsNotEmpty()
  status: ChallengeStatus;

  @ApiPropertyOptional({ example: 'Field study started with 5 engineering students.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

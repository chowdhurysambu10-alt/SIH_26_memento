import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateChallengeDto {
  @ApiPropertyOptional({ description: 'Updated title of the challenge' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ description: 'Updated description of the challenge' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

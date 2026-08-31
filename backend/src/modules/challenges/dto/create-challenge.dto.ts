import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChallengeDto {
  @ApiProperty({
    example: 'Arsenic Contamination in Drinking Well at Dumka Block',
    description: 'Concise summary of the societal challenge',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example:
      'Over 200 households in Dumka block are facing severe skin lesions and gastrointestinal issues due to high arsenic concentrations in local handpumps.',
    description: 'Detailed description of the problem, affected community, and impact',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Dumka', description: 'Jharkhand District name' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiPropertyOptional({ example: 'Village Kathikund, Near Panchayat Bhavan' })
  @IsOptional()
  @IsString()
  location_text?: string;

  @ApiPropertyOptional({ example: 24.2694, description: 'GPS Latitude' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 87.2476, description: 'GPS Longitude' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    example: ['https://demo.supabase.co/storage/v1/object/public/challenge-media/dumka_well.jpg'],
    description: 'Array of image/document URLs if already hosted',
  })
  @IsOptional()
  @IsArray()
  media_urls?: string[];
}

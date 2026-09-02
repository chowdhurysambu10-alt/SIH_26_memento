import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class OverrideRoutingDto {
  @ApiPropertyOptional({ example: 'c1000000-0000-0000-0000-000000000004' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ example: 'a1000000-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsUUID()
  assigned_institution_id?: string;

  @ApiProperty({ example: 'Re-routed to BIT Sindri due to specialized water filtration research lab.' })
  @IsString()
  @IsNotEmpty()
  override_reason: string;
}

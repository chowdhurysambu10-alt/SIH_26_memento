import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '../../../common/constants/roles.enum';

export class SignupDto {
  @ApiProperty({ example: 'priya.sharma@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SuperSecret123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: UserRole, default: UserRole.CITIZEN })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'a1000000-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsUUID()
  org_id?: string;

  @ApiPropertyOptional({ example: 'Ranchi' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: '+91 9876543210' })
  @IsOptional()
  @IsString()
  contact?: string;
}

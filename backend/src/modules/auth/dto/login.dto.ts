import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'priya.sharma@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SuperSecret123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'citizen', required: false })
  @IsString()
  @IsOptional()
  expectedRole?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Enter field type', example: 'email/phone' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ description: 'Enter new-password', example: 'newPassword123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'Enter otp', example: '123523' })
  @IsNotEmpty()
  @IsString()
  otp: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Enter user id', example: '121edsfr4r53werw34' })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'Enter new-password', example: 'newPassword123' })
  @IsNotEmpty()
  @IsString()
  new_password: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Enter email', example: 'admin@test.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Enter password', example: 'Password@123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class UserLoginDto {
  @ApiProperty({ description: 'Enter field type', example: 'email/phone' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Enter field value',
    example: 'admin@test.com/1234567890',
  })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiProperty({ description: 'Enter password', example: 'Password@123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'Enter fcm token', example: 'dsfjkfhnkhnkfjhndkhfkf' })
  @IsNotEmpty()
  @IsString()
  fcm_token: string;
}

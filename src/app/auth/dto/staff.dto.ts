import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class StaffDeleteDto {
  @ApiProperty({
    description: 'Enter staff id',
    example: '66aa4a2c9c3feeb6347f6df8',
  })
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class StaffGetDto {
  @ApiProperty({
    description: 'Enter staff any',
    example: '66aa4a2c9c3feeb6347f6df8',
  })
  search_key: string;
}
export class UpdateStaffDTO {
  @ApiProperty({
    description: 'Unique identifier of the staff member',
    example: '64c9b0b2e8a0b0d1f4e1c1b1',
  })
  @IsString()
  // @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'First name of the staff member',
    example: 'John',
    required: false,
  })
  @IsOptional()
  // @IsString()
  // @IsNotEmpty()
  first_name?: string;

  @ApiProperty({
    description: 'Last name of the staff member',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  // @IsString()
  // @IsNotEmpty()
  last_name?: string;

  @ApiProperty({
    description: 'Email address of the staff member',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  // @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Mobile number of the staff member',
    example: '9876543210',
    required: false,
  })
  @IsOptional()
  // @IsString()
  // @IsNotEmpty()
  mobile_number?: string;

  @ApiProperty({
    description: 'Password for the staff member',
    example: 'newPasswordHash',
    required: false,
  })
  @IsOptional()
  // @IsString()
  // @IsNotEmpty()
  password?: string;

  @ApiProperty({
    description: 'enter profile image url',
    example: 'abc.png',
    required: false,
  })
  @IsOptional()
  profile_image?: string;

  @ApiProperty({
    description: 'Agent code for the staff member',
    example: 'AG123',
    required: false,
  })
  @IsOptional()
  // @IsString()
  agent_code?: string | null;

  @ApiProperty({
    description: 'Indicates if the staff member is active',
    example: true,
    required: false,
  })
  @IsOptional()
  // @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    description: 'Indicates if the staff member is not deletable',
    example: false,
    required: false,
  })
  @IsOptional()
  // @IsBoolean()
  not_deletable?: boolean;
}

import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
// import { isUnique } from 'src/decorators/is-unique.decorator';

export class MasterUserRegistertDTO {

  @IsOptional()
  @ApiProperty({
    description: 'Enter role id',
    example: '66aa2344d8d5249915e77fc8'
  })
  role_id: string[] | null;

  @IsOptional()
  @ApiProperty({
    description: 'Enter staff id',
    example: '66aa2344d8d5249915e77fc8'
  })
  staff_id: string | null;


  @IsOptional()
  @ApiProperty({
    description: 'Enter store id',
    example: '66aa2344d8d5249915e77fc8'
  })
  store_id: string | null;

  @IsOptional()
  @ApiProperty({ description: 'franchise name', example: 'coma' })
  franchise: string|null;

  @ApiProperty({ description: 'Enter first name', example: 'Amit' })
  @IsString()
  @IsOptional()
  first_name: string;

  @ApiProperty({ description: 'Enter last name', example: 'Patel' })
  @IsString()
  @IsOptional()
  last_name: string;

  @ApiProperty({ description: 'Enter country code', example: '+91' })
  @Length(0, 6)
  @IsString()
  @IsOptional()
  country_code: string;

  @ApiProperty({
    description: 'Enter user email address',
    example: 'amit@test.com',
  })
  @IsOptional()
  @IsEmail()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Enter user mobile number number',
    example: '7894561231',
  })
  @IsOptional()
  @Length(0, 15)
  @IsString()
  mobile_number: string;

  @ApiProperty({
    description: 'Enter user mobile number number',
    example: '7894561231',
  })
  @IsOptional()
  @IsString()
  password: string;


  
  @ApiProperty({
    description: 'Enter user is active',
    example: true,
  })
  @IsOptional()
  is_active: boolean;
  
  @ApiProperty({
    description: 'Enter user not debatable',
    example: false,
  })
  @IsOptional()
  not_deletable: boolean;

  @ApiProperty({
    description: 'Enter is admin',
    example: false,
  })
  @IsOptional()
  is_admin: boolean;

  @ApiProperty({
    description: 'Enter profile_image url',
    example: false,
  })
  @IsOptional()
  profile_image: string;
}

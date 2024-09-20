import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'Enter user first name', example: 'Jhon' })
  @IsOptional()
  first_name: string;

  @ApiProperty({ description: 'Enter user last name', example: 'Doe' })
  @IsOptional()
  last_name: string;
  @ApiProperty({
    description: 'Enter user email address',
    example: 'jhon.doe@gmail.com',
  })
  @IsOptional()
  email: string;

  @ApiProperty({ description: 'Enter country code', example: '1' })
  @IsOptional()
  country_code: string;

  @ApiProperty({
    description: 'Enter user phone number',
    example: '7894561231',
  })
  @IsOptional()
  phone: string;

  @ApiProperty({
    description: 'Enter profile image',
    example: 'abc.png',
  })
  @IsOptional()
  profile_image: string;
}

export class UpdateCustomerStatus {
  @ApiProperty({
    description: 'Enter customer id',
    example: 'asa233455rgdrg54tr',
  })
  @IsNotEmpty()
  customer_id: string;

  @ApiProperty({ description: 'Enter active status', example: 'true|false' })
  @IsOptional()
  is_active: boolean;

  @ApiProperty({ description: 'Enter deleted status', example: 'true|false' })
  @IsOptional()
  is_deleted: boolean;
}

export class UpdateKYCStatus {
  @ApiProperty({
    description: 'Enter customer id',
    example: 'asa233455rgdrg54tr',
  })
  @IsNotEmpty()
  customer_id: string;

  @ApiProperty({ description: 'Enter active status', example: 'true|false' })
  @IsOptional()
  is_kyc_verified: boolean;

}

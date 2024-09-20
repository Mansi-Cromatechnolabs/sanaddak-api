import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsOptional, IsString, Length } from 'class-validator';

export class UserRegistertDTO {
  @ApiProperty({ description: 'Enter user first name', example: 'Jhon' })
  @IsNotEmpty()
  @Length(0, 20)
  first_name: string;

  @ApiProperty({ description: 'Enter user last name', example: 'Doe' })
  @IsNotEmpty()
  @Length(0, 20)
  last_name: string;

  @ApiProperty({
    description: 'Enter user email address',
    example: 'jhon.doe@gmail.com',
  })
  @IsOptional()
  email: string;

  @ApiProperty({ description: 'Enter country code', example: '+1' })
  @IsNotEmpty()
  @Length(1, 3)
  @IsNumberString()
  country_code: string;

  @ApiProperty({ description: 'Enter user phone number', example: '7894561231' })
  @IsNotEmpty()
  @Length(0, 15)
  phone: string;

  @ApiProperty({ description: 'Enter agent code', example: '1234568' })
  @IsNotEmpty()
  @IsString()
  agent_code: string;

  @ApiProperty({ description: 'Enter fcm token', example: 'dsfjkfhnkhnkfjhndkhfkf' })
  @IsNotEmpty()
  @IsString()
  fcm_token: string;


  @ApiProperty({ description: 'Enter voucher code', example: '1234564' })
  @IsOptional()
  voucher_code: string;


  @ApiProperty({ description: 'Enter user password', example: 'Password@123', })
  @IsNotEmpty()
  // @Length(8, 24)
  // @Matches(/((?=.*\d)|(?=.*[^\w\s]))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
  //     message: 'password too weak, add at least 8 characters, including uppercase letter, lowercase letter, number, and special character',
  // })
  password: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNumberString, IsOptional, Length } from 'class-validator';

export class UpdateUserDto {
    @ApiProperty({ description: 'Enter user first name', example: 'Jhon' })
    @IsOptional()
    @Length(0, 20)
    first_name: string;

    @ApiProperty({ description: 'Enter user last name', example: 'Doe' })
    @IsOptional()
    @Length(0, 20)
    last_name: string;

    @ApiProperty({
      description: 'Enter user email address',
      example: 'jhon.doe@gmail.com',
    })
    @IsOptional()
    @IsEmail()
    @Length(0, 30)
    email: string;
    
    @ApiProperty({ description: 'Enter country code', example: '1' })
    @IsOptional()
    @Length(1, 3)
    @IsNumberString()
    country_code: string;

    @ApiProperty({ description: 'Enter user mobile number', example: '7894561231' })
    @IsOptional()
    @Length(0, 15)
    mobile_number: string;
    
    @IsOptional()
    profile_image: string;
}
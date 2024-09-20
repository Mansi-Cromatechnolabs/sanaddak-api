import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumberString, Length, Matches } from 'class-validator';

export class StaffRegistertDTO {
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
    @IsNotEmpty()
    @IsEmail()
    @Length(0, 30)
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

    @ApiProperty({ description: 'Enter user password', example: 'Password@123', })
    @IsNotEmpty()
    // @Length(8, 24)
    // @Matches(/((?=.*\d)|(?=.*[^\w\s]))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    //     message: 'password too weak, add at least 8 characters, including uppercase letter, lowercase letter, number, and special character',
    // })
    password: string;
}

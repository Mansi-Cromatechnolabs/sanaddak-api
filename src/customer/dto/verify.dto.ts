import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class VerifyOtp {
    @ApiProperty({ description: 'Enter field type', example: 'email/phone' })
    @IsNotEmpty()
    @IsString()
    type: string;

    @ApiProperty({ description: 'Enter field value', example: 'admin@test.com/1234567890' })
    @IsNotEmpty()
    @IsString()
    value: string;

    @ApiProperty({ description: 'Enter otp', example: '123523' })
    @IsNotEmpty()
    otp: string;

}

export class UserVerification {
    @ApiProperty({ description: 'Enter field type', example: 'email/phone' })
    @IsNotEmpty()
    @IsString()
    type: string;

    @ApiProperty({ description: 'Enter field value', example: 'xyz@gmail.com/+911023456789' })
    @IsNotEmpty()
    @IsString()
    value: string;

    @ApiProperty({ description: 'Enter is_active', example: 'true/false' })
    @IsNotEmpty()
    @IsBoolean()
    is_active: Boolean;
}

export class CheckPasswordDto {
    @ApiProperty({ example: 'email/phone', description: 'comnunication type' })
    @IsNotEmpty()
    @IsString()
    type: string;

    @ApiProperty({ example: 'oldPassword123', description: 'The old password' })
    @IsNotEmpty()
    @IsString()
    old_password: string;
}

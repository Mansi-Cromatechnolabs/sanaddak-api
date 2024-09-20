import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({ description: 'Enter field type', example: 'email/phone' })
    @IsNotEmpty()
    @IsString()
    type: string;
  
    @ApiProperty({ description: 'Enter field value', example: 'xyz@gmail.com/+911023456789' })
    @IsNotEmpty()
    @IsString()
    value: string;
}

export class ResetPasswordDto {
    @ApiProperty({ description: 'Enter user id', example: '121edsfr4r53werw34' })
    @IsNotEmpty()
    @IsString()
    user_id: string;

    @ApiProperty({ description: 'Enter new-password', example: 'newPassword123'})
    @IsNotEmpty()
    @IsString()
    new_password: string;
}

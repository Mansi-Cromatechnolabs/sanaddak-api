import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ description: 'Enter old-password', example: 'Password123'})
    @IsNotEmpty()
    old_password: string;

    @ApiProperty({ description: 'Enter new-password', example: 'Password123'})
    @IsNotEmpty()
    new_password: string;
}
export class StaffChangePasswordDto {
    @ApiProperty({ description: 'Enter old-password', example: 'Password123'})
    @IsNotEmpty()
    old_password: string;

    @ApiProperty({ description: 'Enter new-password', example: 'Password123'})
    @IsNotEmpty()
    new_password: string;
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
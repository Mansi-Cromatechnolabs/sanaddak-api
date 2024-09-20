import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateUserRoleAssignDTO {
    @ApiProperty({ description: 'Enter user ID', example: '60b8d295f4d3f8271c23c8b6' })
    @IsNotEmpty()
    @IsMongoId()
    user_id: string;

    @ApiProperty({ description: 'Enter role ID', example: '60b8d295f4d3f8271c23c8b5' })
    @IsNotEmpty()
    @IsMongoId()
    role_id: string;
}

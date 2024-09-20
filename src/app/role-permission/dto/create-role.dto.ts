import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length } from 'class-validator';

export class CreateRoleDTO {
    @ApiProperty({ description: 'Enter role name', example: 'admin', })
    @IsNotEmpty()
    name: string;
}
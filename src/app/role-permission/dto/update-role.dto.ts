import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length } from 'class-validator';

export class UpdateRoleDTO {
    @ApiProperty({ description: 'Enter role id', example: '1', })
    @IsNotEmpty()
    id: number;

    @ApiProperty({ description: 'Enter role name', example: 'admin', })
    @IsNotEmpty()
    name: string;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GlobalConfigDTO {
    @ApiProperty({ description: 'enter type', example: 'auth|appointment' })
    @IsNotEmpty()
    @IsString()
    type: string;

    @ApiProperty({ description: 'enter key', example: 'key_name' })
    @IsNotEmpty()
    @IsString()
    key: string;

    @ApiProperty({ description: 'enter value', example: 'value' })
    @IsNotEmpty()
    value: any;

    @IsOptional()
    created_by: string;

    @IsOptional()
    updated_by: string;

    @IsOptional()
    update_date: Date;
}

export class GetGlobalConfig {
    @ApiProperty({ description: 'enter key', example: 'tenure' })
    @IsOptional()
    @IsString()
    key: string;
}

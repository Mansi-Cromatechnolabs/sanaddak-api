import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StoreRemoveDTO {
    @ApiProperty({ description: 'Enter store id', example: '' })
    @IsNotEmpty()
    @IsString()
    store_id: string;
}

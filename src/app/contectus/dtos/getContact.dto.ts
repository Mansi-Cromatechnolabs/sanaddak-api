import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";


export class GetContactDetailsDto{
    @ApiProperty({ example: '669771674f30029d1e8e4f0f', description: 'sore id' })
    @IsOptional()
    store_id: string;
}
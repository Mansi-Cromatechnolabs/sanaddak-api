import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ContactDetailsDto {
    @ApiProperty({ example: '669771674f30029d1e8e4f0f', description: 'sore id' })
    @IsNotEmpty()
    @IsString()
    store_id: string;
    
    @ApiProperty({ example: '+91 9515445218', description: 'mobile number' })
    @IsNotEmpty()
    @IsString()
    mobile_number: string;

    @ApiProperty({ example: 'Johnpeer@gmail.com', description: 'Johnpeer@gmail.com' })
    @IsNotEmpty()
    @IsString()
    @Matches(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,{message:"Email is not In valid Formate"})
    email: string;
}

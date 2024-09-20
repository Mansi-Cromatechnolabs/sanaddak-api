import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class ContactUsDto {
    @ApiProperty({ example: 'Full Name', description: 'John peer' })
    @IsNotEmpty()
    @IsString()
    full_name: string;

    @ApiProperty({ example: 'Johnpeer@gmail.com', description: 'Johnpeer@gmail.com' })
    @IsNotEmpty()
    @IsString()
    @Matches(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,{message:"Email is not In valid Formate"})
    email: string;
    
    @ApiProperty({ example: 'subject', description: 'Transaction Problem (303)' })
    @IsNotEmpty()
    @IsString()
    subject: string;

    @ApiProperty({ example: 'message', description: 'Transaction processing problem (303)' })
    @IsNotEmpty()
    @IsString()
    message: string;
    
    @ApiProperty({ example: 'Image', description: 'base64' })
    @IsNotEmpty()
    @IsString()
    attachment:string

    @ApiProperty({ example: '123', description: 'enter store id' })
    @IsOptional()
    store_id:string
}

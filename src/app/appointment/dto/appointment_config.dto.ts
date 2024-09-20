import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class BranchDayAvailabilityDTO {
    @IsOptional()
    day_master_id: string;

    @ApiProperty({ example: '66976618af45058ced4591e3', description: 'enter store id' })
    @IsNotEmpty()
    @IsString()
    store_id: string;

    @ApiProperty({ example: 'monday', description: 'enter day name' })
    @IsNotEmpty()
    @IsString()
    day: string;

    @ApiProperty({ example: 'true/false', description: 'enter day availability' })
    @IsNotEmpty()
    @IsBoolean()
    is_open: boolean;
}

export class BranchTimeAvailabilityDTO {
    @IsOptional()
    time_slot_id: string;

    @IsOptional()
    day_master: string;

    @IsOptional()
    is_active: boolean;

    @ApiProperty({ example: '66976618af45058ced4591e3', description: 'enter store id' })
    @IsNotEmpty()
    @IsString()
    store_id: string;

    @ApiProperty({ example: 'monday', description: 'enter day name' })
    @IsNotEmpty()
    @IsString()
    day: string;

    @ApiProperty({ example: 'true/false', description: 'enter day availability' })
    @IsNotEmpty()
    @IsBoolean()
    is_open: boolean;

    @ApiProperty({ example: '10AM', description: 'enter slot start time' })
    @IsNotEmpty()
    @IsString()
    start_time: string;

    @ApiProperty({ example: '12PM', description: 'enter slot end time' })
    @IsNotEmpty()
    @IsString()
    end_time: string;

    @ApiProperty({ example: '3', description: 'enter slot attendees limit' })
    @IsNotEmpty()
    @IsNumber()
    max_attendee: number;
}

export class AppointmentAvailability{
    @IsOptional()
    day_master_id: string;

    @ApiProperty({ example: '66976618af45058ced4591e3', description: 'enter store id' })
    @IsNotEmpty()
    @IsString()
    store_id: string;

    @ApiProperty({ example: 'monday', description: 'enter day name' })
    @IsNotEmpty()
    @IsString()
    day: string;

    @ApiProperty({ example: 'true/false', description: 'enter day availability' })
    @IsNotEmpty()
    @IsBoolean()
    is_open: boolean;

    @ApiProperty({ example: `[{start_time: 10AM, end_time: 12PM, max_attendee: 5}]`, description: 'enter day availability' })
    @IsNotEmpty()
    @IsArray()
    slots: {start_time:string, end_time:string,max_attendee:number}[];
}

export class DaySlotsDTO {
    @ApiProperty({ example: 'monday', description: 'enter day' })
    @IsNotEmpty()
    day: string;

    @ApiProperty({ example: 'fcwerdewr3254t5y56y56', description: 'enter store id' })
    @IsNotEmpty()
    store_id: string;
}

export class StoresDayDTO {
    @ApiProperty({ example: 'fcwerdewr3254t5y56y56', description: 'enter store id' })
    @IsNotEmpty()
    store_id: string;
    
    @ApiProperty({ example: 'monday', description: 'enter day' })
    @IsOptional()
    day: string;
}

export class TimeSlotDTO {
    @ApiProperty({ example: 'monday', description: 'enter day' })
    @IsNotEmpty()
    id: string;
}

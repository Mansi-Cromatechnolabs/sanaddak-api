import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class UserAppointmentDTO {
    @IsOptional()
    customer_id: string;

    @ApiProperty({ example: 'cwe4ty54gy54e656757rg54', description: 'enter store id' })
    @IsNotEmpty()
    store_id: string;

    @ApiProperty({ example: 'cwe4ty54gy54e656757rg54', description: 'enter timeslot id' })
    @IsNotEmpty()
    time_slot_id: string;

    @ApiProperty({ example: '[cwe4ty54gy54e656757rg54]', description: 'enter valuation id' })
    @IsOptional()
    valuation_id: string[];

    @ApiProperty({ example: '1 August 2024', description: 'enter appointment date' })
    @IsOptional()
    booking_date: Date

    @IsOptional()
    is_branch_visited: boolean

    @IsOptional()
    booking_number: string

    @ApiProperty({ example: '1', description: 'enter appointment type' })
    @IsNotEmpty()
    appointment_type: number

    @ApiProperty({ example: 'cwe4ty54gy54e656757rg54', description: 'enter loan id' })
    @IsOptional()
    loan_id: string;
}

export class UserAppointment {
    @ApiProperty({ example: 'cwe4ty54gy54e656757rg54', description: 'enter user id or store id' })
    @IsNotEmpty()
    id: string;
}

export class BookedUserAppointment {
    @ApiProperty({ example: 'cwe4ty54gy54e656757rg54', description: 'enter user id or store id' })
    @IsNotEmpty()
    store_id: string;

    @ApiProperty({ example: 'cwe4ty54gy54e656757rg54', description: 'enter timeslot id' })
    @IsNotEmpty()
    time_slot_id: string;

    @IsOptional()
    booking_date?: Date;

    @IsOptional()
    is_branch_visited?: boolean;
}

export class UpdateAppointmentStatus{
    @ApiProperty({ example: 'cwe4ty54gy54e656757rg54', description: 'enter valuation id' })
    @IsNotEmpty()
    valuation_id: string;

    @ApiProperty({ example: 'true/false', description: 'enter brach visit status' })
    @IsNotEmpty()
    is_branch_visited: boolean;
}

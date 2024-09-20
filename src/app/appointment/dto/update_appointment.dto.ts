import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class UpdateAppointmentDTO {
    @ApiProperty({ example: 'adsf4tr456rgedt5g54', description: 'enter appointment id' })
    @IsNotEmpty()
    appointment_id: string;

    @ApiProperty({ example: 'adsf4tr456rgedt5g54', description: 'enter valuation id' })
    @IsNotEmpty()
    valuation_id: string;
}
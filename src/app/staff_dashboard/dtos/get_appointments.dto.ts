import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class GetAppointmentDTO {
    @IsOptional()
    @ApiProperty({
        description: 'Enter appointment Id',
        example: "66acc4a881996a47c48ac0ed",
    })
    id: string;
    @IsOptional()
    @ApiProperty({
        description: 'Enter appointment emi of specific date any formate',
        example: `2024-08-06`,
    })
    date: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class GetLoanEmiDTO {
    @IsNotEmpty()
    @ApiProperty({
        description: 'Enter loan emi state',
        example: 2,
    })
    payment_state: number;
     
    @IsOptional()
    @ApiProperty({
        description: 'Enter loan emi of specific date any formate',
        example: `20/10/2003`,
    })
    date: number;
}

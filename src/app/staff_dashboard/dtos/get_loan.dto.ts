import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class GetLoanDTO {
    @IsNotEmpty()
    @ApiProperty({
        description: 'Enter loan Id',
        example: "66acb78632b7fa1cd1cb1ea4",
    })
    loan_id: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Length } from "class-validator";

export class UpdateSettingDto {
    @ApiProperty({ description: 'Enter key', example: 'limit', })
    @IsNotEmpty()
    @Length(0, 20)
    key?: string;

    @ApiProperty({ description: 'Enter value', example: '10', })
    @IsNotEmpty()
    @Length(0, 20)
    value?: string;
}

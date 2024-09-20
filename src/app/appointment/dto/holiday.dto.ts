import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class StoreHolidayDTO {
    @ApiProperty({ example: 'adsf4tr456rgedt5g54', description: 'enter store id' })
    @IsNotEmpty()
    store_id: string;

    @ApiProperty({ example: 'monday', description: 'enter holiday name' })
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'YYYY-MM-DDTHH:mm:ss.SSSZ', description: 'enter date of holiday' })
    @IsNotEmpty()
    holiday_date: Date;
}

export class UpdateStoreHolidayDTO {
    
    @ApiProperty({ example: 'adsf4tr456rgedt5g54', description: 'enter store id' })
    @IsOptional()
    store_id: string;

    @ApiProperty({ example: 'adsf4tr456rgedt5g54', description: 'enter holiday name' })
    @IsNotEmpty()
    id: string;

    @ApiProperty({ example: 'monday', description: 'enter holiday name' })
    @IsOptional()
    name: string;

    @ApiProperty({ example: 'YYYY-MM-DDTHH:mm:ss.SSSZ', description: 'enter date of holiday' })
    @IsOptional()
    holiday_date: Date;
}

export class GetStoreHolidayDTO {
    @ApiProperty({ example: 'adsf4tr456rgedt5g54', description: 'enter store id' })
    @IsNotEmpty()
    store_id: string;
}
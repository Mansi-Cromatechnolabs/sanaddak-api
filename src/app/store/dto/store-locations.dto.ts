import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsOptional, ValidateIf } from 'class-validator';

export class StoreLocationDTO {
  
  @ApiProperty({ required: false, type: Number, example: 1 })
  @IsOptional()
  @ValidateIf((v) => v.page !== '')
  @IsNumberString()
  page: number;
  
  @ApiProperty({ description: 'Enter store latitude', example: '23.0367641' })
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({ description: 'Enter store longitude', example: '72.5111531' })
  @IsNotEmpty()
  longitude: number;
}

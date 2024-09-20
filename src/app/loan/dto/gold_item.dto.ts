import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AssetImageDTO {
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class GoldItemDTO {
  @IsNotEmpty()
  @IsString()
  valuation_id: string;

  @ApiProperty({
    description: 'Enter item name',
    example: 'chain',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Enter item weight',
    example: 18,
  })
  @IsNotEmpty()
  @IsNumber()
  gold_weight: number;

  @ApiProperty({
    description: 'Enter item purity caratage',
    example: 18,
  })
  @IsNotEmpty()
  @IsNumber()
  gold_purity_entered_per_1000: number;

  @ApiProperty({
    description: 'Upload item images',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  asset_images: string;

  @ApiProperty({
    description: 'Enter item specification',
    example: 'chain with...',
  })
  @IsNotEmpty()
  @IsString()
  specification: string;

  @ApiProperty({
    description: 'Enter item barcode',
    example: 'ABC1212121212123',
  })
  @IsNotEmpty()
  @IsString()
  barcode_number: string

  @IsOptional()
  liquidate_number?:string
}

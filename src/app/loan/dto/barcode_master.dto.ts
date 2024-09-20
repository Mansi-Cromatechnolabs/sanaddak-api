import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBarcodeDTO {
  @ApiProperty({
    description: 'Enter liquidity id',
    example: 'LI123456',
  })
  @IsOptional()
  @IsString()
  liquidity_id?: string;

  @ApiProperty({
    description: 'Enter gold piece id',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  gold_piece_id?: string;

  @ApiProperty({
    description: 'Enter barcode type',
    example: '1',
  })
  @IsNotEmpty()
  @IsString()
  type: number;

  @IsNotEmpty()
  @IsString()
  barcode: string;

  @IsNotEmpty()
  @IsString()
  barcode_url: string;

  @IsNotEmpty()
  @IsNumber()
  status: number;

  @IsOptional()
  created_date?: Date;

  @IsOptional()
  container_liquidity_details?: string[];

  @IsOptional()
  @IsString()
  container_number?: string;
}

export class LiquidityDetails {
  liquidity_id: string;
  liquidity_number: string;
}

export class AssignBarcodeDTO {
  @ApiProperty({
    description: 'Enter liquidity id',
    example: 'LI123456',
  })
  @IsOptional()
  liquidity_number?: string;

  @ApiProperty({
    description: 'Enter type',
    example: '1',
  })
  @IsOptional()
  type?: number;

  @ApiProperty({
    description: 'Enter container barcode',
    example: 'ABC1234567891234',
  })
  @IsOptional()
  liquidity_details?: [LiquidityDetails];

  @ApiProperty({
    description: 'Enter barcode number',
    example: 'ABC1234567891234',
  })
  @IsOptional()
  barcode_number?: string;

  @IsOptional()
  new_liquidity_barcode?: string;
}

export class UpdateBarcodeDetails {
  @ApiProperty({
    description: 'Enter liquidity id',
    example: 'LI123456',
  })
  @IsOptional()
  liquidity_id?: string;

  @ApiProperty({
    description: 'Enter type',
    example: '1',
  })
  @IsOptional()
  type?: number;

  @IsOptional()
  @IsString()
  container_number?: string;

  @IsOptional()
  new_liquidity_barcode?: string

  @IsOptional()
  new_barcode_url?: string
}

export class DisputeGenerateDTO {
  @ApiProperty({
    description: 'Enter type',
    example: '1',
  })
  @IsNotEmpty()
  type?: number;

  @ApiProperty({
    description: 'Enter barcode number',
    example: 'ABC1234567891234',
  })
  @IsNotEmpty()
  barcode_number?: string;

  @ApiProperty({
    description: 'Enter missing items',
    example: '[{liquidity_id:1234567891234}/{gold_piece_id:1234567891234}]',
  })
  @IsOptional()
  missing_id: string[];

  @ApiProperty({
    description: 'Enter remarks',
    example: 'Your item....',
  })
  @IsOptional()
  remarks?: string;
}

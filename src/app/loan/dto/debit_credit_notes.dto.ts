import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDebitCreditNotesDTO {
  @ApiProperty({
    description: 'Enter liquidity id',
    example: 'LI123456',
  })
  @IsOptional()
  @IsString()
  liquidity_id?: string;

  @ApiProperty({
    description: 'Enter customer id',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  customer_id?: string;

  @ApiProperty({
    description: 'Enter branch id',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  branch_id?: string;

  @ApiProperty({
    description: 'Enter note type',
    example: '1',
  })
  @IsNotEmpty()
  @IsString()
  note_type: number;

  @ApiProperty({
    description: 'Enter container id',
    example: '12312323',
  })
  @IsNotEmpty()
  @IsString()
  note_number: string;

  @ApiProperty({
    description: 'Enter contacted value',
    example: '12312323',
  })
  @IsNotEmpty()
  @IsNumber()
  contracted_value: number;

  @ApiProperty({
    description: 'Enter actual value',
    example: '12312323',
  })
  @IsNotEmpty()
  @IsNumber()
  actual_value: number;

  @ApiProperty({
    description: 'Enter difference amount',
    example: '12312323',
  })
  @IsNotEmpty()
  @IsNumber()
  difference_amount: number;

  @ApiProperty({
    description: 'Enter container id',
    example: '12312323',
  })
  @IsNotEmpty()
  @IsString()
  container_id: string;

  @ApiProperty({
    description: 'Enter remarks',
    example: '1',
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  authorized_by: string;

  @IsOptional()
  created_date?: Date;
}

export class CreateDebitCreditNoteItemDTO {
  @ApiProperty({
    description: 'Enter gold piece id',
    example: '123456789',
  })
  @IsOptional()
  @IsString()
  gold_piece_id?: string;

  @ApiProperty({
    description: 'Enter debit note id',
    example: '123456789',
  })
  @IsOptional()
  @IsString()
  note_id?: string;

  @ApiProperty({
    description: 'Enter difference amount',
    example: '12312323',
  })
  @IsNotEmpty()
  @IsNumber()
  contracted_weight: number;

  @ApiProperty({
    description: 'Enter difference amount',
    example: '12312323',
  })
  @IsNotEmpty()
  @IsNumber()
  actual_weight: number;

  @ApiProperty({
    description: 'Enter difference amount',
    example: '12312323',
  })
  @IsNotEmpty()
  @IsNumber()
  contracted_purity: number;

  @ApiProperty({
    description: 'Enter difference amount',
    example: '12312323',
  })
  @IsNotEmpty()
  @IsNumber()
  actual_purity: number;

  @ApiProperty({
    description: 'Enter difference amount',
    example: '12312323',
  })
  @IsNotEmpty()
  @IsNumber()
  gold_price_24_karate: number;

  @ApiProperty({
    description: 'Enter difference amount',
    example: '12312323',
  })
  @IsNotEmpty()
  @IsNumber()
  gold_piece_value: number;

  @IsOptional()
  created_date?: Date;
}

export class VerifyGoldItem {
  @ApiProperty({
    description: 'Enter gold piece id',
    example: '123123231233',
  })
  @IsNotEmpty()
  @IsString()
  gold_piece_id?: string;

  @ApiProperty({
    description: 'Enter barcode number',
    example: 'ABC1234567891234',
  })
  @IsNotEmpty()
  gold_piece_barcode: string;

  @ApiProperty({
    description: 'Enter gold weight',
    example: '10',
  })
  @IsNotEmpty()
  @IsNumber()
  gold_piece_weight: number;

  @ApiProperty({
    description: 'Enter gold purity',
    example: '22',
  })
  @IsNotEmpty()
  @IsNumber()
  gold_piece_purity: number;

  @ApiProperty({
    description: 'Enter specification',
    example: 'any',
  })
  @IsOptional()
  gold_piece_specification?: string;
}

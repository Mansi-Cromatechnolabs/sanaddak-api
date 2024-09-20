import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class LoanPaymentTransactionDTO {
  @ApiProperty({
    description: 'enter customer id',
    example: '66b21760e210a260dbedafaa',
  })
  @IsNotEmpty()
  @IsString()
  customer_id: string;

  @ApiProperty({
    description: 'enter emi id',
    example: '66b21760e210a260dbedafaa',
  })
  @IsOptional()
  loan_emi_id: string;

  @ApiProperty({
    description: 'enter loan id',
    example: '66b21760e210a260dbedafaa',
  })
  @IsNotEmpty()
  @IsString()
  loan_id: string;

  @ApiProperty({ description: 'enter transaction status', example: 'success/failed' })
  @IsNotEmpty()
  @IsString()
  transaction_status: string;

  @ApiProperty({
    description: 'enter payment reference id',
    example: '66b21760e210a260dbedafaa',
  })
  @IsOptional()
  transaction_id: string;

  @ApiProperty({
    description: 'enter transaction method',
    example: 'Vodafone wallet',
  })
  @IsOptional()
  transaction_method: string;

  @ApiProperty({ description: 'enter transaction details ', example: '' })
  @IsOptional()
  transaction_details: string;

  @ApiProperty({ description: 'enter transaction amount', example: '1000' })
  @IsOptional()
  transaction_amount: string;

  @ApiProperty({ description: 'enter transaction amount', example: '1000' })
  @IsOptional()
  transaction_fees: number;

  @ApiProperty({ description: 'enter transaction amount', example: '1000' })
  @IsOptional()
  transaction_vat: number;

  @ApiProperty({ description: 'enter transaction amount', example: '1000' })
  @IsOptional()
  number: string;

  @ApiProperty({
    description: 'enter payment description',
    example: 'description',
  })
  @IsOptional()
  description: string;

  @ApiProperty({
    description: 'enter payment status',
    example: 'credited/debited',
  })
  @IsNotEmpty()
  payment_status: string;

  @IsOptional()
  payment_date: Date;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { GoldItemDTO } from './gold_item.dto';
import { Type } from 'class-transformer';

export class LoanDTO {
  @ApiProperty({
    description: 'Enter customer id',
    example: 'ad23rfgngyjy5ygdfg6tged',
  })
  @IsOptional()
  @IsString()
  customer_id: string;

  @ApiProperty({
    description: 'Enter valuation id',
    example: 'ad23rfgngyjy5ygdfg6tged',
  })
  @IsOptional()
  valuation_id: string;

  @ApiProperty({
    description: 'Enter item name',
    example:
      "[{name: 'chain', gold_weight: '10', gold_purity_entered_per_1000: '20', asset_images: url, specification: any, barcode_number:'ABC1212121212123'}]",
  })
  @IsNotEmpty()
  @Type(() => GoldItemDTO)
  item: GoldItemDTO[];

  @ApiProperty({
    description: 'Enter specification',
    example: 'specifications',
  })
  @IsOptional()
  specification: string;

  @ApiProperty({
    description: 'Enter parent loan id',
    example: 'ad23rfgngyjy5ygdfg6tged',
  })
  @IsOptional()
  parent_loan_id: string;

  @ApiProperty({
    description: 'Enter tenure',
    example: '3',
  })
  @IsOptional()
  tenure: number;

  @ApiProperty({
    description: 'Enter topup request',
    example: '0/1',
  })
  @IsOptional()
  topup_request: number;

  @IsOptional()
  unsigned_agreements: string;
}

export class CreateLoanDto {
  @ApiProperty({
    description: 'Enter parent loan id',
    example: 'ad23rfgngyjy5ygdfg6tged',
  })
  @IsOptional()
  parent_loan_id: string;

  @ApiProperty({
    description: 'Enter customer id',
    example: 'ad23rfgngyjy5ygdfg6tged',
  })
  @IsNotEmpty()
  @IsString()
  customer_id: string;

  @ApiProperty({
    description: 'Enter valuation id',
    example: 'ad23rfgngyjy5ygdfg6tged',
  })
  @IsOptional()
  valuation_id: string;

  @ApiProperty({
    description: 'Enter item name',
    example:
      '[{name: chain, gold_weight: 10, gold_purity_entered_per_1000: 20, asset_images: url, specification: any}]',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GoldItemDTO)
  item: GoldItemDTO[];

  @IsOptional()
  @IsNumber()
  gold_weight: number;

  @IsOptional()
  @IsNumber()
  gold_rate_at_valuation: number;

  @IsOptional()
  @IsNumber()
  gold_purity_entered_per_1000: number;

  @IsOptional()
  @IsNumber()
  tenure_in_months: number;

  @IsOptional()
  @IsNumber()
  customer_cash_needs: number;

  @IsOptional()
  @IsNumber()
  cash_to_customer: number;

  @IsOptional()
  @IsNumber()
  karatage_price_per_gram: number;

  @IsOptional()
  gold_piece_value: number;

  @IsOptional()
  @IsNumber()
  admin_purchase_fees: number;

  @IsOptional()
  @IsNumber()
  net_purchase_price_from_customer: number;

  @IsOptional()
  @IsNumber()
  buy_back_price: number;

  @IsOptional()
  @IsNumber()
  margin: number;

  @IsOptional()
  @IsNumber()
  advance_payment_by_customer: number;

  @IsOptional()
  @IsNumber()
  balance_to_complete_buyback_back: number;

  @IsOptional()
  @IsNumber()
  available_liquidity_to_customer: number;

  @IsOptional()
  @IsDate()
  transaction_date: Date;

  @IsOptional()
  @IsNumber()
  margin_rate: number;

  @IsOptional()
  @IsNumber()
  gold_price_24_karate: number;

  @IsOptional()
  @IsNumber()
  reserve_rate: number;

  @IsOptional()
  @IsNumber()
  admin_fee_rate: number;

  @IsOptional()
  @IsNumber()
  admin_fee_rate_renewal: number;

  @IsOptional()
  @IsString()
  assets_base_url: string;

  @IsOptional()
  @IsString()
  specification: string;

  @IsOptional()
  liquidate_number: string;

  @IsOptional()
  loan_status: string;

  @IsNotEmpty()
  branch_id: string;

  @IsOptional()
  created_by: string;

  @IsOptional()
  top_up_requested: number;

  @IsOptional()
  top_up_value: number;

  @IsOptional()
  balance_to_paid_by_customer: number;

  @IsOptional()
  liquidation_cost_rate:number;

  @IsOptional()
  liquidation_costs: number;

  @IsOptional()
  new_gold_liquidation_value: number;

  @IsOptional()
  funds_due_to_customer:number;
}

export class LoanCloserDto {
  @ApiProperty({
    description: 'Enter loan id',
    example: 'ad23rfgngyjy5ygdfg6tged',
  })
  @IsNotEmpty()
  loan_id: string;

  @ApiProperty({
    description: 'Enter loan closer type',
    example: '2/3',
  })
  @IsNotEmpty()
  loan_closer_type: number;
}

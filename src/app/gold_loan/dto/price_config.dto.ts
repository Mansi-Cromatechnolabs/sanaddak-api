import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PriceCofigDTO {
  @ApiProperty({ description: 'enter tag id', example: 'xdwdw67ydewd34rf4tr' })
  @IsNotEmpty()
  @IsString()
  tag_id: string;

  @ApiProperty({ description: 'enter margin rate', example: '3.75%' })
  @IsOptional()
  margin_rate: number;

  @ApiProperty({ description: 'enter gold price 24 carat', example: '3600' })
  @IsOptional()
  gold_price_24_karate: number;

  @ApiProperty({ description: 'enter reserve rate', example: '30%' })
  @IsOptional()
  reserve_rate: number;

  @ApiProperty({ description: 'enter admin fee rate', example: '3.50%' })
  @IsOptional()
  admin_fee_rate: number;

  @ApiProperty({ description: 'admin fee rate renewal', example: '1.50%' })
  @IsOptional()
  admin_fee_rate_renewal: number;

  @ApiProperty({ description: 'admin penalty rate', example: '10%' })
  @IsOptional()
  penalty_rate: number;

  @ApiProperty({ description: 'admin penalty rate', example: '10%' })
  @IsOptional()
  liquidation_cost: number;

  @ApiProperty({ description: 'min admin purchase fees', example: '375' })
  @IsOptional()
  min_admin_purchase_fees: number;

  @IsOptional()
  config_update_date: Date;

  @IsOptional()
  updated_by: string;

  @IsOptional()
  is_active: boolean;
}

export class GetPriceConfig {
  @ApiProperty({ description: 'enter tag id', example: 'xdwdw67ydewd34rf4tr' })
  @IsNotEmpty()
  @IsString()
  tag_id: string;
}

export class AssetDetails {
  @ApiProperty({ description: 'enter buyback term in month', example: '3' })
  @IsNotEmpty()
  @IsNumber()
  tenure_in_months: number;

  @ApiProperty({ description: 'enter buyback term in month', example: '15000' })
  @IsNotEmpty()
  @IsNumber()
  customer_cash_needs: number;

  @ApiProperty({ description: 'enter buyback term in month', example: '10' })
  @IsNotEmpty()
  @IsNumber()
  gold_weight: number;

  @ApiProperty({ description: 'enter buyback term in month', example: '18' })
  @IsNotEmpty()
  @IsNumber()
  gold_purity_entered_per_1000: number;

  @ApiProperty({
    description: 'enter valuation id',
    example: '1cfsfw3r34t4erf43t45t/null',
  })
  @IsOptional()
  valuation_id?: string;

  @IsOptional()
  specification?: string;
}

export class RenewalDetails {
  @ApiProperty({ description: 'enter remaining balance', example: '13500' })
  @IsNotEmpty()
  @IsNumber()
  remaining_balance: number;

  @ApiProperty({ description: 'enter request topup', example: '1/2' })
  @IsNotEmpty()
  @IsNumber()
  customer_request_topup: number;

  @ApiProperty({ description: 'enter buyback term in month', example: '3' })
  @IsNotEmpty()
  @IsNumber()
  weight: number;

  @ApiProperty({ description: 'enter buyback term in month', example: '3' })
  @IsNotEmpty()
  @IsNumber()
  goldPurityEnteredPer1000: number;

  @ApiProperty({ description: 'enter buyback term in month', example: '3' })
  @IsNotEmpty()
  @IsNumber()
  buyBackTermInMonths: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PriceCofigLogDTO {
  @ApiProperty({ description: 'enter tag id', example: 'xdwdw67ydewd34rf4tr' })
  @IsNotEmpty()
  @IsString()
  tag_id: string;

  @ApiProperty({ description: 'enter requested gold price', example: '3600' })
  @IsOptional()
  requested_gold_price: number;

  @ApiProperty({ description: 'enter margin rate', example: '3.75%' })
  @IsOptional()
  margin_rate: number;

  @ApiProperty({ description: 'enter reserve rate', example: '30%' })
  @IsOptional()
  reserve_rate: number;

  @ApiProperty({ description: 'enter admin fee rate', example: '3.50%' })
  @IsOptional()
  admin_fee_rate: number;

  @ApiProperty({ description: 'admin fee rate renewal', example: '1.50%' })
  @IsOptional()
  admin_fee_rate_renewal: number;

  @ApiProperty({ description: 'penalty rate', example: '10%' })
  @IsOptional()
  penalty_rate:number

  @ApiProperty({ description: 'liquidation cost rate', example: '10%' })
  @IsOptional()
  liquidation_cost: number

  @ApiProperty({ description: 'min admin purchase fees', example: '375' })
  @IsOptional()
    min_admin_purchase_fees: number;

  @IsOptional()
  config_update_date: Date;

  @IsOptional()
  updated_by: string;

  @IsOptional()
  status: number

  @IsOptional()
  user_role_permission: number
}
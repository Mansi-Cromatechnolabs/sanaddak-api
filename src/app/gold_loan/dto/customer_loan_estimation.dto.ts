import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class InitialValuationDTO {
  @IsOptional()
  customer_id: string;

  @IsNotEmpty()
  @IsNumber()
  gold_weight: number;

  @IsNotEmpty()
  @IsNumber()
  gold_rate_at_valuation: number;

  @IsNotEmpty()
  @IsNumber()
  gold_purity_entered_per_1000: number;

  @IsNotEmpty()
  @IsNumber()
  tenure_in_months: number;

  @IsNotEmpty()
  @IsNumber()
  customer_cash_needs: number;

  @IsNotEmpty()
  @IsNumber()
  cash_to_customer: number;

  @IsNotEmpty()
  @IsNumber()
  margin_rate:number

  @IsNotEmpty()
  @IsNumber()
  gold_price_24_karate: number

  @IsNotEmpty()
  @IsNumber()
  reserve_rate: number;

  @IsNotEmpty()
  @IsNumber()
  admin_fee_rate: number;

  @IsNotEmpty()
  @IsNumber()
  admin_fee_rate_renewal: number;

  @IsNotEmpty()
  @IsString()
  created_by: string;

  @IsNotEmpty()
  @IsString()
  updated_by: string;

  @IsNotEmpty()
  @IsString()
  specification: string;

  @IsNotEmpty()
  @IsBoolean()
  is_completed: boolean;

  @IsNotEmpty()
  @IsBoolean()
  is_deleted: boolean;
  
  @IsOptional()
  loan_estimation_calculated_date: Date;

  @IsOptional()
  loan_estimation_modify_date: Date;

  @IsOptional()
  valuation_number: string;

  @IsOptional()
  @IsNumber()
  available_liquidity_to_customer: number

  @ApiProperty({ description: 'liquidation cost rate', example: '10%' })
  @IsOptional()
  liquidation_cost: number
}

export class CustomerIniatialLoanEstimationDTO {
  @ApiProperty({
    example: 'enter valuation id',
    description: '668b76809ed354t540c3a350ce',
  })
  @IsNotEmpty()
  valuation_id: string;

  // @ApiProperty({ example: 'enter user id', description: '668b76809ed354t540c3a350ce' })
  @IsOptional()
  customer_id: string;
}

export class KycVerificationDto {
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    example: '1720593255329-1.2.9-android_onsite',
    description: 'reference id',
  })
  @IsOptional()
  @IsString()
  reference_id: string;

  @ApiProperty({ example: '{}', description: 'shufti response' })
  @IsNotEmpty()
  @IsObject()
  kyc_details: Object;

  @ApiProperty({
    example: 'verification.accepted',
    description: 'kyc verification status',
  })
  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  document_expiry_date: string;

  @IsOptional()
  kyc_date: Date;
}

export class CustomerKycVerificationDto {
  @ApiProperty({
    example: 'enter customer id',
    description: '',
  })
  @IsNotEmpty()
  customer_id: string;

  @ApiProperty({
    example: 'enter reference id',
    description: '',
  })
  @IsOptional()
  reference_id: string;

  @ApiProperty({
    example: 'enter reference expiry date',
    description: '',
  })
  @IsOptional()
  expiry_date: Date;

  @ApiProperty({ example: '{}', description: 'digify response' })
  @IsOptional()
  kyc_details: Object;

  @ApiProperty({
    example: 'enter reference kyc status',
    description: 'true/false',
  })
  @IsNotEmpty()
  @IsString()
  kyc_status: string;

  @IsOptional()
  expiry_status: boolean;

  @ApiProperty({
    example: 'enter document_type',
    description: 'Egyptian Nation Card',
  })
  @IsOptional()
  document_type: string;

  @ApiProperty({ example: '{}', description: 'digify response' })
  @IsOptional()
  kyc_documents?: Object;
}

export class GetCustomerKycVerificationDto {
  @IsNotEmpty()
  customer_id: string;
}

export class KycApprovedDisapprovedStatusDto {
  @ApiProperty({
    example: 'enter customer id',
    description: '',
  })
  @IsNotEmpty()
  customer_id: string;

  @ApiProperty({
    example: 'enter review by',
    description: '',
  })
  @IsNotEmpty()
  review_by: string;

  @ApiProperty({
    example: 'enter review status',
    description: '',
  })
  @IsNotEmpty()
  review_status: string;

  @ApiProperty({ example: 'enter kyc dispprove reason', description: '' })
  @IsOptional()
  reason: string;

  @ApiProperty({ example: 'enter kyc is front side doc verified', description: 'true/false' })
  @IsOptional()
  is_front_side_doc_verified: boolean;

  @ApiProperty({ example: 'enter kyc is back side doc verified', description: 'true/false' })
  @IsOptional()
  is_back_side_doc_verified: boolean;

  @ApiProperty({ example: 'enter kyc is selfie verified', description: 'true/false' })
  @IsOptional()
  is_selfie_verified: boolean;
}

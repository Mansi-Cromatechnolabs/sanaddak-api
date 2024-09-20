import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class LoanEmiDTO {
  @IsNotEmpty()
  @IsString()
  loan_id: string;

  @IsNotEmpty()
  @IsNumber()
  tenure_in_months: number;

  @IsNotEmpty()
  @IsNumber()
  margin: number;

  @IsNotEmpty()
  @IsOptional()
  loan_transaction_date: Date;

  @IsOptional()
  @IsNumber()
  emi_number: number;

  @IsOptional()
  @IsNumber()
  emi_amount: number;

  @IsOptional()
  emi_payment_date: Date;

  @IsOptional()
  emi_created_date: Date;
}

export class EmiWeiveDTO {
  @IsNotEmpty()
  @IsString()
  loan_emi_id: string;

  @IsNotEmpty()
  @IsString()
  waiver_type: string;

  @IsNotEmpty()
  @IsString()
  waiver_value: number;

  @IsNotEmpty()
  @IsNumber()
  is_waive: number;
}

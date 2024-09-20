import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { InitialValuations } from 'src/app/gold_loan/schema/customer_loan_estimation.schema';
import { Staff } from 'src/app/staff/schema/staff.schema';
import { Branch } from 'src/app/store/Schema/store.schema';
import { Customer } from 'src/customer/schema/customer.schema';

@Schema({ _id: false })
export class SignedAgreement {
  @Prop({ required: false })
  agreement_type: string;

  @Prop({ required: false })
  agreement_url: string;

  @Prop({ required: false, type: Date })
  created_date: Date;
}
const SignedAgreementSchema = SchemaFactory.createForClass(SignedAgreement);

@Schema()
export class Loan extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  })
  customer_id: Customer;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'InitialValuation',
    index: true,
  })
  valuation_id: InitialValuations;

  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Staff', index: true })
  verifier_id: Staff;

  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Store', index: true })
  verification_office_id: Branch;

  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Store', index: true   })
  branch_id: Branch;

  @Prop({ required: false, type: String })
  loan_status: ['InActive', 'Active', 'Extend', 'Buyback', 'Liquidate', 'Overdue'];

  @Prop({ required: false })
  parent_loan_id: string;

  @Prop({ required: true, type: Number })
  gold_weight: number;

  @Prop({ required: true, type: Number })
  gold_rate_at_valuation: number;

  @Prop({ required: true, type: Number })
  gold_purity_entered_per_1000: number;

  @Prop({ required: false, type: Number })
  tenure_in_months: number;

  @Prop({ required: false, type: Number })
  customer_cash_needs: number;

  @Prop({ required: false, type: Number })
  cash_to_customer: number;

  @Prop({ required: false, type: Number })
  karatage_price_per_gram: number;

  @Prop({ required: false, type: Number })
  gold_piece_value: number;

  @Prop({ required: false, type: Number })
  admin_purchase_fees: number;

  @Prop({ required: false, type: Number })
  net_purchase_price_from_customer: number;

  @Prop({ required: false, type: Number })
  buy_back_price: number;

  @Prop({ required: false, type: Number })
  margin: number;

  @Prop({ required: false, type: Number })
  advance_payment_by_customer: number;

  @Prop({ required: false, type: Number })
  balance_to_complete_buyback_back: number;

  @Prop({ required: false, type: Number })
  available_liquidity_to_customer: number;

  @Prop({ required: false })
  buy_back_date: Date;

  @Prop({ required: false })
  liquidate_date: Date;

  @Prop({ required: false, type: Date })
  transaction_date: Date;

  @Prop({ required: false })
  loan_liquidaty_date: Date;

  @Prop({ required: false })
  loan_extended_date: Date;

  @Prop({ required: false, type: Number })
  margin_rate: number;

  @Prop({ required: false, type: Number })
  gold_price_24_karate: number;

  @Prop({ required: false, type: Number })
  reserve_rate: number;

  @Prop({ required: false, type: Number })
  admin_fee_rate: number;

  @Prop({ required: false, type: Number })
  admin_fee_rate_renewal: number;

  @Prop({ required: false, type: Number })
  liquidation_cost_rate:number

  @Prop({ required: false, type: String })
  assets_base_url: string;

  @Prop({ required: false })
  specification: string;

  @Prop({ required: false, default: false })
  is_verified: Boolean;

  @Prop({ required: true })
  liquidate_number: string;

  @Prop({ required: false, type: Date })
  verification_date: Date;

  @Prop({ required: false })
  liquidity_barcode: string;

  @Prop({ required: false, type: String })
  created_by: string;

  @Prop({ required: false, type: [SignedAgreementSchema] })
  signed_agreements: SignedAgreement[];

  @Prop({ required: false, type: String })
  unsigned_agreements: string;

  @Prop({ required: false, type: String })
  fullfillment_agreement: string;

  @Prop({ required: false, type: SignedAgreement })
  signed_fullfillment_agreement: SignedAgreement;

  @Prop({ required: false, type: String })
  liquidate_agreement: string;

  @Prop({ required: false, type: SignedAgreement })
  signed_liquidate_agreement: SignedAgreement;

  @Prop({ required: false, type: Number })
  top_up_requested: number;

  @Prop({ required: false, type: Number })
  top_up_value: number;

  @Prop({ required: false, type: Number })
  balance_to_paid_by_customer: number

  @Prop({ required: false, type: Number })
  liquidation_costs:number

  @Prop({ required: false, type: Number })
  new_gold_liquidation_value:number

  @Prop({ required: false, type: Number })
  funds_due_to_customer:number
}

export const LoanSchema = SchemaFactory.createForClass(Loan);

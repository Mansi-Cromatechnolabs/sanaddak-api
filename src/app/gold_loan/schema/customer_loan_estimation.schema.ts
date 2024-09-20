import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Branch } from 'src/app/store/Schema/store.schema';
import { Customer } from 'src/customer/schema/customer.schema';

@Schema()
export class InitialValuations extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  })
  customer_id: Customer;

  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Store', index: true })
  branch_id: Branch;

  @Prop({ required: true, type: Number })
  gold_weight: number;

  @Prop({ required: true, type: Number })
  gold_rate_at_valuation: number;

  @Prop({ required: true, type: Number })
  gold_purity_entered_per_1000: number;

  @Prop({ required: true, type: Number })
  tenure_in_months: number;

  @Prop({ required: true, type: Number })
  customer_cash_needs: number;

  @Prop({ required: true, type: Number })
  cash_to_customer: number;

  @Prop({ required: true, type: Number })
  margin_rate: number;

  @Prop({ required: true, type: Number })
  gold_price_24_karate: number;

  @Prop({ required: true, type: Number })
  reserve_rate: number;

  @Prop({ required: true, type: Number })
  admin_fee_rate: number;

  @Prop({ required: true, type: Number })
  admin_fee_rate_renewal: number;

  @Prop({ required: false, type: String })
  created_by: string;

  @Prop({ required: false, type: String })
  updated_by: string;

  @Prop({ required: false, default: null, type: String })
  specification: string;

  @Prop({ required: false, default: false, type: Boolean })
  is_completed: boolean;

  @Prop({ required: false, default: false, type: Boolean })
  is_deleted: boolean;

  @Prop({ required: false })
  loan_estimation_calculated_date: Date;

  @Prop({ required: false })
  loan_estimation_modify_date: Date;

  @Prop({ required: false })
  loan_estimation_delete_date: Date;

  @Prop({ required: false })
  valuation_number: string;

  @Prop({ required: false, default: null })
  valuation_status: number;

  @Prop({ required: false, type: Number })
  available_liquidity_to_customer: number;

  @Prop({ required: false, type: Number })
  liquidation_cost: number;
}

export const InitialValuationSchema =
  SchemaFactory.createForClass(InitialValuations);

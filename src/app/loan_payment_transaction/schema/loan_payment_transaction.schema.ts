import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Loan } from 'src/app/loan/schema/loan.schema';
import { LoanEmi } from 'src/app/loan/schema/loan_emi.schema';
import { Customer } from 'src/customer/schema/customer.schema';

@Schema()
export class LoanPaymentTransaction extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true,
  })
  customer_id: Customer;

  @Prop({
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanEmi',
    index: true,
  })
  loan_emi_id: LoanEmi;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Loan', index: true })
  loan_id: Loan;

  @Prop({ required: false, type: String })
  transaction_method: string;

  @Prop({
    required: true,
    type: String,
  })
  transaction_status: string;

  @Prop({ required: false, type: String })
  transaction_id: string;

  @Prop({ required: false, type: String })
  transaction_details: string;

  @Prop({ required: true, type: String })
  transaction_amount: string;

  @Prop({ required: false, type: Number })
  transaction_fees: number;

  @Prop({ required: false, type: Number })
  transaction_vat: number;

  @Prop({ required: false, type: String })
  number: string;

  @Prop({ required: false, type: String })
  payment_status: string;

  @Prop({ required: false, type: String })
  description: string;

  @Prop({ required: false })
  payment_date: Date;
}

export const LoanPaymentTransactionSchema = SchemaFactory.createForClass(
  LoanPaymentTransaction,
);

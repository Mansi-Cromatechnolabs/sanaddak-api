import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Loan } from './loan.schema';
import { EmiStatus } from 'src/utils/enums.util';

@Schema()
export class LoanEmi extends Document {
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'InitialValuations', index: true })
  loan_id: Loan;

  @Prop({ required: true, type: Number })
  emi_number: number;

  @Prop({ required: true, type: Number })
  emi_amount: number;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(EmiStatus),
    default: EmiStatus.PENDING,
  })
  emi_status: EmiStatus;

  @Prop({ required: true, type: Date })
  emi_payment_date: Date;

  @Prop({ required: false, type: Number, default:0 })
  penalty: number

  @Prop({ required: false, type: Number, default:0 })
  total_due: number

  @Prop({ required: false, type: String })
  waiver_type: string

  @Prop({ required: false, type: Number, default: 0 })
  waiver_value: number

  @Prop({ required: false, type: Number, default: 0 })
  waiver_amount: number

  @Prop({ required: false, type: Number, default: 0 })
  net_penalty: number

  @Prop({ required: true, type: Date })
  emi_created_date: Date;
}

export const LoanEmiSchema = SchemaFactory.createForClass(LoanEmi);
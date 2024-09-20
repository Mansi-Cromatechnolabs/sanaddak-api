import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Loan } from './loan.schema';
import { Customer } from 'src/customer/schema/customer.schema';
import { Branch } from 'aws-sdk/clients/sagemaker';
import { NoteType } from 'src/utils/enums.util';

@Schema({ collection: 'debit_credit_notes' })
export class DebitCreditNotes extends Document {
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Loan', index: true })
  liquidity_id: Loan;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true,
  })
  customer_id: Customer;

  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Store', index: true })
  branch_id: Branch;

  @Prop({ required: true, type: Number })
  note_type: NoteType;

  @Prop({ required: false, type: String })
  note_number: string;

  @Prop({ required: true, type: Number })
  contracted_value: number;

  @Prop({ required: true, type: Number })
  actual_value: number;

  @Prop({ required: true, type: Number })
  difference_amount: number;

  @Prop({ required: false, type: String })
  container_id: string;

  @Prop({ required: false, type: String })
  remarks: string;

  @Prop({ required: false, type: String })
  authorized_by: string;

  @Prop({ required: false, type: Date })
  created_date: Date;

  @Prop({ required: false, type: Date })
  updated_date: Date;
}

export const DebitCreditNotesSchema =
  SchemaFactory.createForClass(DebitCreditNotes);

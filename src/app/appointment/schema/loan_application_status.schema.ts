import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { InitialValuations } from '../../gold_loan/schema/customer_loan_estimation.schema';
import { ApplicationStatus } from 'src/utils/enums.util';

@Schema({ collection: 'loan_application_status' })
export class LoanApplicationStatus extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InitialValuations',
    index: true,
  })
  valuation_id: InitialValuations;

  @Prop({ required: true, type: Number })
  application_status: ApplicationStatus;

  @Prop({ required: false, type: String })
  reason_for_rejection: string;

  @Prop({ required: false })
  status_update_date: Date;

  @Prop({ required: false })
  status_delete_date: Date;
}

export const LoanStatusSchema = SchemaFactory.createForClass(
  LoanApplicationStatus,
);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

import { BranchTimeAvailability } from './appointment_config.schema';
import { Branch } from 'src/app/store/Schema/store.schema';
import { Customer } from 'src/customer/schema/customer.schema';
import { InitialValuations } from 'src/app/gold_loan/schema/customer_loan_estimation.schema';
import { Loan } from 'src/app/loan/schema/loan.schema';
import { AppointmentType } from 'src/utils/enums.util';

@Schema({ timestamps: true })
export class LoanAppointMentBooking extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  customer_id: Customer;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    index: true,
  })
  store_id: Branch;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BranchTimeAvailability',
    index: true,
  })
  time_slot_id: BranchTimeAvailability;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InitialValuation',
        index: true,
      },
    ],
  })
  valuation_id: [InitialValuations];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    index: true,
  })
  loan_id: Loan;

  @Prop({ required: false })
  day: string;

  @Prop({ required: false })
  booking_date: Date;

  @Prop({ required: false })
  is_branch_visited: Boolean;

  @Prop({ required: false })
  booking_time: Date;

  @Prop({ required: true })
  booking_number: string;

  @Prop({ required: true })
  appointment_type: AppointmentType;

  @Prop({ required: false })
  appointment_start_time: string;

  @Prop({ required: false })
  appointment_end_time: string;
}

export const LoanAppointMentBookingSchema = SchemaFactory.createForClass(
  LoanAppointMentBooking,
);

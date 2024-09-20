import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Branch } from 'src/app/store/Schema/store.schema';

@Schema({ timestamps: true })
export class BranchDayAvailability extends Document {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Store' })
  store_id: Branch;

  @Prop({ required: true })
  day: string;

  @Prop({ required: true })
  is_open: boolean;

  @Prop({ required: false })
  created_at: Date;

  @Prop({ required: false })
  updated_at: Date;
}

@Schema({ timestamps: true })
export class BranchTimeAvailability extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'BranchDayAvailability' })
  day_master: BranchDayAvailability;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Branch' })
  store_id: Branch;

  @Prop({ required: true })
  day: string;

  @Prop({ required: true })
  start_time: string;

  @Prop({ required: true })
  end_time: string;

  @Prop({ required: true })
  max_attendee: number;

  @Prop({ required: false })
  is_active: boolean;

  @Prop({ required: false })
  created_at: Date;

  @Prop({ required: false })
  updated_at: Date;

  @Prop({ required: false })
  deleted_at: Date;
}

export const BranchTimeAvailabilitySchema =
  SchemaFactory.createForClass(BranchTimeAvailability);
export const BranchDayAvailabilitySchema = SchemaFactory.createForClass(BranchDayAvailability);

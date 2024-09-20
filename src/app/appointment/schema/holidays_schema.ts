import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Branch } from 'src/app/store/Schema/store.schema';

@Schema({ timestamps: true })
export class StoreHoliday extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId,required: true, ref: 'branch', index: true })
  store_id: Branch;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: Date })
  holiday_date: Date;

  @Prop({ required: false })
  created_at: Date;

  @Prop({ required: false })
  updated_at: Date;
}

export const StoreHolidaySchema = SchemaFactory.createForClass(StoreHoliday);

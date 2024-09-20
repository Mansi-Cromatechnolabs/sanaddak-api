import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as DbSchema } from 'mongoose';

export type ContectDetailsDocument = ContectDetails & Document;

@Schema({})
export class ContectDetails {
  @Prop({ type:DbSchema.Types.ObjectId,required: true })
  store_id: DbSchema.Types.ObjectId;
  
  @Prop({ required: true })
  mobile_number: string;

  @Prop({ required: true })
  email: string;
}

export const ContectDetailsSchma = SchemaFactory.createForClass(ContectDetails)

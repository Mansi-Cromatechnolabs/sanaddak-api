import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Branch } from 'src/app/store/Schema/store.schema';

export type ContectUsDocument = ContectUs & Document;

@Schema({})
export class ContectUs {
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Store' })
  store_id: Branch;
  
  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true})
  email: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;
  
  @Prop({required:true})
  attachment:string

  @Prop({ required: false })
  created_at: Date;

  @Prop({ required: false })
  updated_at: Date;

  @Prop({ required: false })
  appointed_at: Date | null;
}

export const ContectUsSchema = SchemaFactory.createForClass(ContectUs);

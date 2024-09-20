import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type SupportDocument = Support & Document;

@Schema({})
export class Support {
  @Prop({ type:MongooseSchema.Types.ObjectId,required: true ,ref:'users'})
  user_id: MongooseSchema.Types.ObjectId;

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

export const SupportSchema = SchemaFactory.createForClass(Support);

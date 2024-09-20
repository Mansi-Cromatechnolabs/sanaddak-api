import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type ContectUsDocument = ContectUs & Document;

@Schema({})
export class ContectUs {
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
}

export const ContectUsSchema = SchemaFactory.createForClass(ContectUs);

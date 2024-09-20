import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type TanantUserDocument = TanantUser & Document;

@Schema({ collection: 'Staff' })
export class TanantUser {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Store', default: null, required: false })
  store_id: MongooseSchema.Types.ObjectId | null;

  @Prop()
  franchise: string;

  @Prop({ required: true })
  first_name: string;

  @Prop({ required: true })
  last_name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  country_code: string;

  @Prop({ required: false })
  profile_image: string;

  @Prop({ required: true })
  mobile_number: string;

  @Prop({ required: false })
  fcm_token: string;

  @Prop({ required: false })
  token: string;

  @Prop({ required: false })
  otp_code: string;

  @Prop({ required: false })
  otp_timestamp: Date;

  @Prop({ required: true })
  password: string;

  @Prop({ required: false })
  agent_code: string;

  @Prop({ required: false })
  is_admin: boolean;

  @Prop({ required: false, default: true })
  is_active: boolean;

  @Prop({ required: false, default: false })
  is_deleted: boolean;

  @Prop({ required: false, default: false })
  is_email_verified: boolean;

  @Prop({ required: false, default: false })
  is_mobile_number_verified: boolean;

  @Prop({ required: false, default: false })
  not_deletable: boolean;

  @Prop({ required: false })
  created_at: Date;

  @Prop({ required: false })
  updated_at: Date;

  @Prop({ required: false })
  deleted_at: Date;
}

export const TanantUserSchema = SchemaFactory.createForClass(TanantUser);
TanantUserSchema.set('toJSON', { getters: true });
TanantUserSchema.set('toObject', { getters: true });

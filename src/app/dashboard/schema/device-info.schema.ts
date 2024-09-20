import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { DeviceOs } from 'src/utils/enums.util';

export type DeviceInfoDocument = DeviceInfo & Document;
@Schema()
export class DeviceInfo {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'users' })
  user_id: MongooseSchema.Types.ObjectId | null;

  @Prop({ required: true })
  device_id: string | null;

  @Prop({ required: true })
  device_name: string | null;

  @Prop({ required: true })
  os: DeviceOs | null;

  @Prop({ required: true })
  os_version: string | null;

  @Prop({ required: true })
  ip_address: string | null;

  @Prop({ type:Object,required: true })
  location: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  };

  @Prop({required: true,default:new Date()})
  last_login_datetime:Date
}

export const DeviceInfoSchema = SchemaFactory.createForClass(DeviceInfo);

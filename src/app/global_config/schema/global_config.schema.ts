import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class GlobalConfig extends Document {
  @Prop({ required: true, type: String })
  type: string;

  @Prop({ required: false, type: String })
  key: string;

  @Prop({ required: false, type: Object, String, Number, Date, Array })
  value: any;

  @Prop({ required: false, type: String })
  created_by: string;

  @Prop({ required: false, type: String })
  updated_by: string;

  @Prop({ required: false, type: Date })
  update_date: Date;
}

export const GlobalConfigSchema = SchemaFactory.createForClass(GlobalConfig);

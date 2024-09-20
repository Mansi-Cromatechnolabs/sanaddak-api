import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'notification_template' })
export class NotificationTemplate extends Document {
  @Prop({ required: true, type: String })
  key: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  message: string;

  @Prop({ required: true })
  notification_type: string;

  @Prop({ required: false, type: String })
  created_by: string;

  @Prop({ required: false, type: Date })
  created_date: Date;

  @Prop({ required: false, type: String })
  updated_by: string;
}

export const NotificationTemplateSchema =
  SchemaFactory.createForClass(NotificationTemplate);

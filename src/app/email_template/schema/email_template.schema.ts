import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'email_template' })
export class EmailTemplate extends Document {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required:false, type: String })
  from: string;

  @Prop({ required: false, type: [String] })
  cc: string[];

  @Prop({ required: false, type: [String] })
  bcc: string[];

  @Prop({ required: true, type: String })
  subject: string;

  @Prop({ required: true, type: String })
  body: string;

  @Prop({ required: false, type: String })
  created_by: string;

  @Prop({ required: false, type: Date })
  created_date: Date;

  @Prop({ required: false, type: String })
  updated_by: string;
}

export const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AgreementType } from 'src/utils/enums.util';

@Schema({ collection: 'agreement_template' })
export class AgreementTemplate extends Document {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: Number })
  priority: number;

  @Prop({ required: true, type: String })
  body: string;

  @Prop({ required: true })
  agreement_type: AgreementType;

  @Prop({ required: false, type: String })
  updated_by: string;

  @Prop({ required: false, type: String })
  created_by: string;

  @Prop({ required: false, type: Date })
  created_date: Date;

  @Prop({ required: false, type: Date })
  update_date: Date;
}

export const AgreementTemplateSchema =
  SchemaFactory.createForClass(AgreementTemplate);

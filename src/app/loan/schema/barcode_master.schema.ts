import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Loan } from './loan.schema';
import { GoldItem } from './gold_item.schema';
import { BarcodeStatus, BarcodeType } from 'src/utils/enums.util';

@Schema()
export class BarcodeDetails extends Document {
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Loan', index: true })
  liquidity_id: Loan;

  @Prop({
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoldItem',
    index: true
  })
  gold_piece_id: GoldItem;

  @Prop({ required: true, type: Number })
  type: BarcodeType;

  @Prop({ required: false, type: String })
  container_number: string;

  @Prop({ required: false, type: String })
  barcode: string;

  @Prop({ required: false, type: String })
  barcode_url: string;

  @Prop({ required: false, type: String })
  new_barcode: string;

  @Prop({ required: false, type: String })
  new_barcode_url: string;

  @Prop({ required: false, type: Number })
  status: BarcodeStatus;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Loan' }],
  })
  container_liquidity_details: [Loan];

  @Prop({ required: false, type: String })
  specification: string;

  @Prop({ required: false, type: Date })
  created_date: Date;

  @Prop({ required: false, type: Date })
  updated_date: Date;
}

export const BarcodeDetailsSchema =
  SchemaFactory.createForClass(BarcodeDetails);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { DebitCreditNotes } from './debit_credit_note.schema';
import { GoldItem } from './gold_item.schema';



@Schema({ collection: 'debit_credit_note_items' })
export class DebitCreditNoteItems extends Document {
  @Prop({
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoldItem',
    index: true,
  })
  gold_piece_id: GoldItem;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DebitCreditNotes',
    index: true,
  })
  note_id: DebitCreditNotes;

  @Prop({ required: true, type: Number })
  contracted_weight: number;

  @Prop({ required: true, type: Number })
  actual_weight: number;

  @Prop({ required: true, type: Number })
  contracted_purity: number;

  @Prop({ required: true, type: Number })
  actual_purity: number;

  @Prop({ required: true, type: Number })
  gold_price_24_karate: number;

  @Prop({ required: true, type: Number })
  gold_piece_value: number;

  @Prop({ required: false, type: Date })
  created_date: Date;

  @Prop({ required: false, type: Date })
  updated_date: Date;
}

export const DebitCreditNoteItemsSchema =
  SchemaFactory.createForClass(DebitCreditNoteItems);

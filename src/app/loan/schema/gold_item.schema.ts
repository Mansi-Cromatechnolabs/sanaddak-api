import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { InitialValuations } from 'src/app/gold_loan/schema/customer_loan_estimation.schema';

@Schema()
export class GoldItem extends Document {
    @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'InitialValuations', index: true })
    valuation_id: InitialValuations;

    @Prop({ required: true, type: Number })
    gold_weight: number;

    @Prop({ required: true, type: Number })
    gold_purity_entered_per_1000: number

    @Prop({ required: true, type: String })
    name: string;

    @Prop({ required: false })
    asset_images: string;

    @Prop({ required: false, type: String })
    specification: string;

    @Prop({ required: false, default: null })
    gold_item_barcode: string;
}

export const GoldItemSchema = SchemaFactory.createForClass(GoldItem);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Customer } from './customer.schema';
import { Tag } from 'src/app/gold_loan/schema/tag.schema';

@Schema()
export class CustomerTag extends Document {
    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'tags' })
    tag_id: Tag;

    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'customer' })
    customer_id: Customer;

    @Prop({ required: false, type: Number })
    priority: number;

    @Prop({ required: false })
    create_date: Date;

    @Prop({ required: false })
    update_date: Date;

    @Prop({ required: false })
    delete_date: Date;
}

export const CustomerTagSchema = SchemaFactory.createForClass(CustomerTag);

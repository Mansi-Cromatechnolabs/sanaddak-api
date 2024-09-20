import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Customer } from './customer.schema';

@Schema({ collection: "CustomerInsight" })
export class CustomerInsight extends Document {

    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'customer' })
    customer_id: Customer;

    @Prop({ type: Object, required: true })
    family_details: {
        father_name: string;
        mother_name: string;
        marital_status: string;
        spouse_name: string;
        number_of_children: string;
    };

    @Prop({ type: Object, required: true })
    occupation_details: {
        current_job_title: string;
        employer_name: string;
        employement_start_date: Date;
        monthly_income: string;
    };

    @Prop({ type: Object, required: true })
    social_media_details: {
        facebook_handel: string;
        x_handel: string;
    };

    @Prop({ type: Object, required: true })
    emergency_contact_details: {
        name: string;
        phone: string;
    };

    @Prop({ required: false })
    create_date: Date;

    @Prop({ required: false })
    update_date: Date;

    @Prop({ required: false })
    delete_date: Date;
}

export const CustomerInsightSchema = SchemaFactory.createForClass(CustomerInsight);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: "customer" })
export class Customer extends Document {
    @Prop({ required: true })
    first_name: string;

    @Prop({ required: true })
    last_name: string;

    @Prop({ required: false })
    email: string;

    @Prop({ required: true })
    country_code: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: false })
    profile_image: string;

    @Prop({ required: false })
    password: string;

    @Prop({ required: false, default: true })
    is_notification_enable: boolean;

    @Prop({ required: false, default: false })
    is_active: boolean;

    @Prop({ required: false, default: true })
    is_notification: boolean;

    @Prop({ required: true })
    agent_code: string;

    @Prop({ required: false })
    voucher_code: string;

    @Prop({ required: false })
    token: string;

    @Prop({ required: true })
    fcm_token: string;

    @Prop({ required: false, default: false })
    is_deleted: boolean;

    @Prop({ required: false, default: false })
    is_email_verified: boolean;

    @Prop({ required: false, default: false })
    is_mobile_number_verified: boolean;    
    
    @Prop({ required: false, default: false })
    is_kyc_verified: boolean;

    @Prop({ required: false })
    created_at: Date;

    @Prop({ required: false })
    updated_at: Date;

    @Prop({ required: false })
    deleted_at: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

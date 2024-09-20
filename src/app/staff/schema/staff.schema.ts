import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: "Staff" })
export class Staff extends Document {

    @Prop({ required: true })
    first_name: string;

    @Prop({ required: true })
    last_name: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    country_code: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: false })
    profile_image: string;

    @Prop({ required: false })
    password: string;

    @Prop({ required: false, default: false })
    is_active: boolean;

    @Prop({ required: false })
    token: string;

    @Prop({ required: false })
    created_at: Date;

    @Prop({ required: false })
    updated_at: Date;

    @Prop({ required: false })
    deleted_at: Date;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);

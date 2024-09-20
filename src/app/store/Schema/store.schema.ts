import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Staff } from 'src/app/staff/schema/staff.schema';

@Schema({ timestamps: true })
export class Branch extends Document {
    @Prop({ type: mongoose.Schema.Types.ObjectId,required: true, ref: 'staff' })
    branch_owner_id:Staff

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    address: string;

    @Prop({ type: Object, required: true })
    location: {
        route: any;
        country: string;
        region: string;
        city: string;
        latitude: number;
        longitude: number;
    };

    @Prop({ required: true, default: true })
    is_active: boolean;

    @Prop({ required: true, default: false })
    is_delete: boolean;

    @Prop({ required: false })
    registration_date: Date;

    @Prop({ required: false })
    updated_at: Date;

    @Prop({ required: false })
    deleted_at: Date;

    @Prop({ required: false })
    branch_key: string;
}

export const StoreSchema = SchemaFactory.createForClass(Branch);

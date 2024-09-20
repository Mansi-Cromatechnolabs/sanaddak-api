import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }) // Mongoose automatically manages created_at and updated_at fields
export class Tanant extends Document {
    @Prop({ type: Number, required: true, unique: true, index: true, auto: true })
    id: number;

    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: true })
    db_name: string;

    @Prop({ type: String, required: true })
    subdomain: string;

    @Prop({ type: Boolean, default: true })
    is_active: boolean;

    @Prop({ type: Date, default: null })
    deleted_at: Date;
}

// Create a Mongoose schema for the Tanant class
export const TanantSchema = SchemaFactory.createForClass(Tanant);

// Indexes can also be created if needed
TanantSchema.index({ subdomain: 1 }, { unique: true });

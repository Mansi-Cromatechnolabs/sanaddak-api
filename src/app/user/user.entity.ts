import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Exclude } from 'class-transformer';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User extends Document {
    @Prop({ type: Number, required: true, unique: true, auto: true })
    id: number;

    @Exclude()
    @Prop({ type: Number, required: true })
    tanant_id: number;

    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, unique: true, required: true })
    email: string;

    @Prop({ type: String, required: true })
    phone: string;

    @Exclude()
    @Prop({ type: String, required: true })
    password: string;

    @Prop({ type: Boolean, default: true })
    is_active: boolean;

    @Exclude()
    @Prop({ type: String, maxlength: 255, nullable: true })
    reset_token: string;

    @Exclude()
    @Prop({ type: Date, nullable: true })
    reset_token_date: Date;

    @Exclude()
    @Prop({ type: Date, default: null })
    deleted_at: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes can also be added if needed
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 });

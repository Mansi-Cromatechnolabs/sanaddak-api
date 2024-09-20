import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type UserRoleDocument = UserRole & Document;

@Schema({ collection: 'user_role' })
export class UserRole {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'TanantUser', required: true })
    user_id: mongoose.Schema.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true })
    role_id: mongoose.Schema.Types.ObjectId;
}

export const UserRoleSchema = SchemaFactory.createForClass(UserRole);
UserRoleSchema.set('toJSON', { getters: true });
UserRoleSchema.set('toObject', { getters: true });
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema()
export class Role {
    @Prop({ required: true })
    name: string;

    @Prop({ required: false, default: true })
    is_active: boolean;

    @Prop({ required: false, default: false })
    not_deletable: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
RoleSchema.set('toJSON', { getters: true });
RoleSchema.set('toObject', { getters: true });

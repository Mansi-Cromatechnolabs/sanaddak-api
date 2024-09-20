import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema()
export class Permission {
    @Prop({ required: true })
    name: string;

    @Prop({ required: false, default: true })
    is_active: boolean;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
PermissionSchema.set('toJSON', { getters: true });
PermissionSchema.set('toObject', { getters: true });
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type RolePermissionDocument = RolePermission & Document;

@Schema({ collection: 'role_permissions' })
export class RolePermission {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true })
    role_id: mongoose.Schema.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Permission', required: true })
    permission_id: mongoose.Schema.Types.ObjectId;
}

export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);
RolePermissionSchema.set('toJSON', { getters: true });
RolePermissionSchema.set('toObject', { getters: true });
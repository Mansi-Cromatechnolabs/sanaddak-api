import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { Staff } from 'src/app/staff/schema/staff.schema';
import { Branch } from 'src/app/store/Schema/store.schema';
import { NotificationType } from 'src/utils/enums.util';

@Schema({ collection: 'staff_notification' })
export class StaffNotification extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'branch',
    index: true,
  })
  store_id: Branch;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'staff',
    index: true,
  })
  staff_id: Staff;

  @Prop({ required: false, default: false })
  is_read: boolean;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  notification_type: NotificationType;

  @Prop({ required: false })
  created_by: string;

  @Prop({ required: false })
  updated_by: string;

  @Prop({ required: false })
  created_date: Date;

  @Prop({ required: false })
  updated_date: Date;
}

export const StaffNotificationSchema =
  SchemaFactory.createForClass(StaffNotification);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { Customer } from 'src/customer/schema/customer.schema';
import { NotificationType } from 'src/utils/enums.util';

@Schema({ collection: "customer_notification" })
export class CustomerNotification extends Document {
    
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'customer',index: true })
    customer_id: Customer;

    @Prop({ required: false,default:false })
    is_read: boolean;

    @Prop({ required: true })
    message: string;

    @Prop({ required: true })
    notification_type: NotificationType;

    @Prop({ required: false })
    created_date: Date;
}

export const CustomerNotificationSchema = SchemaFactory.createForClass(CustomerNotification);

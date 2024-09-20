import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { TanantUser } from 'src/app/user/tanant-user.schema';
import { Customer } from 'src/customer/schema/customer.schema';
import { KycStatus, ReviewStatus } from 'src/utils/enums.util';

@Schema()
export class UserKycDetails extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'customer',
    index: true,
  })
  customer_id: Customer;

  @Prop({ required: false })
  reference_id: string;

  @Prop({ type: Object, required: false })
  kyc_details: Object;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(KycStatus),
  })
  kyc_status: KycStatus;

  @Prop({ required: true })
  kyc_date: Date;

  @Prop({
    required: false,
    type: String,
    enum: Object.values(ReviewStatus),
  })
  review_status: ReviewStatus;

  @Prop({
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'staff',
    index: true,
  })
  review_by: TanantUser;

  @Prop({ required: false })
  reason: string;

  @Prop({ required: false })
  is_front_side_doc_verified: boolean;

  @Prop({ required: false })
  is_back_side_doc_verified: boolean;

  @Prop({ required: false })
  is_selfie_verified: boolean;

  @Prop({ required: false })
  document_type: string;

  @Prop({ required: false })
  expiry_date: Date;

  @Prop({ required: false })
  expiry_status: boolean;

  @Prop({ type: Object, required: false })
  kyc_documents: Object;
}

export const UserKycDetailsSchema =
  SchemaFactory.createForClass(UserKycDetails);

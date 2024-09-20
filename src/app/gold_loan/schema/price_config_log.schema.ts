import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Tag } from './tag.schema';
import { PriceConfigStatus, UserRolePermission } from 'src/utils/enums.util';

@Schema()
export class PriceConfigLogs extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
    index: true,
  })
  tag_id: Tag;

  @Prop({ required: false, type: Number })
  requested_gold_price: number;

  @Prop({ required: false, type: Number })
  margin_rate: number;

  @Prop({ required: false, type: Number })
  reserve_rate: number;

  @Prop({ required: false, type: Number })
  admin_fee_rate: number;

  @Prop({ required: false, type: Number })
  min_admin_purchase_fees: number;

  @Prop({ required: false, type: Number })
  admin_fee_rate_renewal: number;

  @Prop({ required: false, type: Number })
  penalty_rate: number;

  @Prop({ required: false, type: Number })
  user_role_permission: UserRolePermission;

  @Prop({ required: true, type: Number })
  status: PriceConfigStatus;

  @Prop({ required: false, type: Number })
  liquidation_cost: number;

  @Prop({ required: false })
  config_update_date: Date;

  @Prop({ required: false, type: String })
  updated_by: string;

  @Prop({ required: false, default: false })
  is_request_proceeded: boolean;
}

export const PriceConfigLogsSchema =
  SchemaFactory.createForClass(PriceConfigLogs);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as Mongoose } from 'mongoose';

@Schema()
export class Tag extends Document {
    @Prop({ required: true, type: String })
    name: string;

    @Prop({ required: false, type: String })
    description: string;

    @Prop({ required: false, type: Boolean })
    is_delete: boolean;

    @Prop({ required: false, type: Boolean })
    is_active: boolean;

    @Prop({ required: false, type: Boolean, default: false })
    is_default: boolean;

    @Prop({ type:Mongoose.Types.ObjectId,required: true})
    created_by: Mongoose.Types.ObjectId; 

    @Prop({ required: false, type: String })
    updated_by: string;

    @Prop({ required: false, type: Date })
    create_date: Date;

    @Prop({ required: false, type: Date })
    update_date: Date;

    @Prop({ required: false, type: Date })
    delete_date: Date;
}

export const TagSchema = SchemaFactory.createForClass(Tag);

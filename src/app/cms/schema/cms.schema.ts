import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: "cms" })
export class Cms extends Document {

    @Prop({ required: true })
    page_name: string;

    @Prop({ required: true })
    page_content: string;

    @Prop({ required: false })
    created_at: Date;

    @Prop({ required: false, type: String })
    created_by: string;

    @Prop({ required: false })
    updated_at: Date;

    @Prop({ required: false })
    deleted_at: Date;
}

export const CmsSchema = SchemaFactory.createForClass(Cms);

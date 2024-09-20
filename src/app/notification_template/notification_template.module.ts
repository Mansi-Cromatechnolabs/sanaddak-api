import { Module } from '@nestjs/common';
import { NotificationTemplateController } from './notification_template.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NotificationTemplate,
  NotificationTemplateSchema,
} from './schema/notification_template.schema';
import { NotificationTemplateService } from './notification_template.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationTemplate.name, schema: NotificationTemplateSchema },
    ]),
  ],
  controllers: [NotificationTemplateController],
  providers: [NotificationTemplateService],
})
export class NotificationTemplateModule {}

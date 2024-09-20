import { Module } from '@nestjs/common';
import { EmailTemplateController } from './email_template.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmailTemplate,
  EmailTemplateSchema,
} from './schema/email_template.schema';
import { EmailTemplateService } from './email_template.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailTemplate.name, schema: EmailTemplateSchema }
    ]),
  ],
  controllers: [EmailTemplateController],
  providers: [EmailTemplateService],
})
export class EmailTemplateModule {}

import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Model, Types } from 'mongoose';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400, _404 } from 'src/utils/http-code.util';
import {
  EmailTemplate,
  EmailTemplateSchema,
} from './schema/email_template.schema';
import {
  AddEmailTemplateDTO,
  EmailTemplateDto,
  GetEmailTemplateDto,
  UpdateEmailTemplateDTO,
} from './dto/email_template.dto';

import { date_moment } from 'src/utils/date.util';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';
import { sendEmail } from 'src/utils/mail.util';

@Injectable()
export class EmailTemplateService {
  public emailTemplateModel: Model<any>;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  async addEmailTemplate(
    addEmailTemplateDTO: AddEmailTemplateDTO,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.emailTemplateModel = setTanantConnection(
      db_name,
      EmailTemplate.name,
      EmailTemplateSchema,
    );

    const existingName = await this.emailTemplateModel
      .findOne({ name: addEmailTemplateDTO.name })
      .exec();

    if (existingName) {
      
      throw new BadRequestException(i18n.t(`lang.email_template.name_exist`));
    }
    addEmailTemplateDTO.created_by = user_id;
    addEmailTemplateDTO.created_date = date_moment();
    const res = new this.emailTemplateModel(addEmailTemplateDTO);
    await res.save();

    return res;
  }
  async updateEmailTemplate(
    updateEmailTemplateDTO: UpdateEmailTemplateDTO,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {

    this.emailTemplateModel = setTanantConnection(
      db_name,
      EmailTemplate.name,
      EmailTemplateSchema,
    );

    const { email_template_id, name, cc, bcc } = updateEmailTemplateDTO;

    const existingTemplate = await this.emailTemplateModel
      .findOne({ name, _id: { $ne: email_template_id } })
      .exec();

    if (existingTemplate) {
      throw new BadRequestException(i18n.t(`lang.email_template.name_exist`));
    }


    const updateData: Partial<UpdateEmailTemplateDTO> = {
      name: name ?? undefined,
      from: updateEmailTemplateDTO.from ?? undefined,
      body: updateEmailTemplateDTO.body ?? undefined,
      subject: updateEmailTemplateDTO.subject ?? undefined,
      cc: cc ?? [], 
      bcc: bcc ?? [], 
      updated_by: user_id,
    };


    const updatedTemplate = await this.emailTemplateModel.findOneAndUpdate(
      { _id: new Types.ObjectId(email_template_id) }, // Convert email_template_id to ObjectId
      { $set: updateData },
      { new: true }
    ).exec();

    if (!updatedTemplate) {
      throw new NotFoundException(i18n.t(`lang.email_template.not_found`));
    }

    return updatedTemplate;
  }

  async getEmailTemplate(user_id: string, db_name: string, getEmailTemplateDto:GetEmailTemplateDto) {
    this.emailTemplateModel = setTanantConnection(
      db_name,
      EmailTemplate.name,
      EmailTemplateSchema,
    );

    if (getEmailTemplateDto.email_template_id) {
      // Return the specific email template
      const emailTemplate = await this.emailTemplateModel
        .findOne({ _id: getEmailTemplateDto.email_template_id })
        .exec();
      return emailTemplate;
    } else {
      // Return all email templates
      const emailTemplates = await this.emailTemplateModel
        .find({})
        .exec();
      return emailTemplates;
    }
  }

  async getEmailTemplateByName(emailTemplateDto: EmailTemplateDto,db_name: string) {
    this.emailTemplateModel = setTanantConnection(
      db_name,
      EmailTemplate.name,
      EmailTemplateSchema,
    );
    const emailTemplate = await this.emailTemplateModel
      .findOne({ name: emailTemplateDto.name })
      .exec();
    return emailTemplate?emailTemplate:false;
  }


  async sendEmail(
    to: string,
    name: string,
    db_name: string,
    data: Record<string, string> = {}
  ): Promise<any> {
    const emailTemplateData = await this.getEmailTemplateByName({ name }, db_name);
    if(emailTemplateData){
      await sendEmail({
        to: to,
        cc: emailTemplateData?.cc || "",
        bcc: emailTemplateData?.bcc || "",
        subject: emailTemplateData?.subject,
        body: emailTemplateData?.body,
        from: emailTemplateData?.from || "",
        data: data,
      });
    }
  }
}

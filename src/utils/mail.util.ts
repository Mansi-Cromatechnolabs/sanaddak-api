import { Injectable, Inject } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { Attachment } from 'nodemailer/lib/mailer';
import { EmailTemplateService } from 'src/app/email_template/email_template.service';
import { MailConfig } from 'src/config/mail.config';

@Injectable()
export class MailUtil {
  constructor() {}

  async sendEmailProcess(email: SendEmailDto) {
    try {
      const transporter: Mail = await nodemailer.createTransport(
        await MailConfig(),
      );

      const { from, data, body, ...fields } = email;

      const html = body ? await this.replaceEmailVariables(body, data) : '';

      const options: Mail.Options = {
        ...fields,
        from: from ?? process.env.MAIL_FROM,
        html: html,
      };

      await transporter.sendMail(options);
      console.log('Email sent successfully......');
    } catch (error) {
      console.log('Email sent failed......');
      throw error;
    }
  }

  private async replaceEmailVariables(
    body: string,
    replacements: Record<string, string>,
  ) {
    return body.replace(/{{(\w*)}}/g, function (m, key) {
      return replacements.hasOwnProperty(key) ? replacements[key] : '';
    });
  }
}

export function sendEmail(email: SendEmailDto) {
  const emailUtil = new MailUtil();
  emailUtil.sendEmailProcess(email);
}

export class SendEmailDto {
  to?: string;
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body: string;
  from?: string;
  data?: Record<string, string>; // This will be used to replace placeholders in the template
  attachments?: Attachment[];
}

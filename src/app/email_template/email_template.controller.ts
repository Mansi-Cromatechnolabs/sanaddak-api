import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  errorResponse,
  PromiseResponse,
  successResponse,
} from 'src/utils/response.util';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Patch,
  Post,
  Req,
  Request,
} from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { _200, _201, _400 } from 'src/utils/http-code.util';
import { EmailTemplateService } from './email_template.service';
import { Public } from 'src/decorators/public.decorator';
import {
  AddEmailTemplateDTO,
  GetEmailTemplateDto,
  UpdateEmailTemplateDTO,
} from './dto/email_template.dto';

@ApiTags('Email Template')
@Controller('email_template')
@ApiBearerAuth()
export class EmailTemplateController {
  constructor(
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  @Post()
  @ApiResponse({ status: _200, description: 'Email template added successfully.' })
  async addEmailTemplate(
    @Request() req,
    @Body() addEmailTemplateDTO: AddEmailTemplateDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const EmailTemplate =
        await this.emailTemplateService.addEmailTemplate(
          addEmailTemplateDTO,
          req.user.id,
          req.user.db_name,
          i18n
        );
      return successResponse(
        _200,
        i18n.t(`lang.email_template.register`),
        EmailTemplate,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Patch()
  @ApiResponse({ status: _200, description: 'Email template updated successfully.' })
  async updateEmailTemplate(
    @Request() req,
    @Body() updateEmailTemplateDTO: UpdateEmailTemplateDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const EmailTemplate =
        await this.emailTemplateService.updateEmailTemplate(
          updateEmailTemplateDTO,
          req.user.id,
          req.user.db_name,
          i18n
        );
      return successResponse(
        _200,
        i18n.t(`lang.email_template.update`),
        EmailTemplate,
      );
    } catch (error) {
      errorResponse(error);
    }
  }


  @Get()
  @ApiResponse({ status: _200, description: 'Get Email template successfully.' })
  async getEmailTemplate(
    @Request() req,
    @Body() getEmailTemplateDto: GetEmailTemplateDto,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const EmailTemplate =
        await this.emailTemplateService.getEmailTemplate(
          req.user.id,
          req.user.db_name,
          getEmailTemplateDto
        );
      return successResponse(
        _200,
        i18n.t(`lang.email_template.get_all`),
        EmailTemplate,
      );
    } catch (error) {
      errorResponse(error);
    }
  }
}

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
import { AgreementTemplateService } from './agreement_template.service';
import { Public } from 'src/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';
import {
  AddAgreementTemplateDTO,
  GetAgreementTemplateDto,
  UpdateAgreementTemplateDTO,
} from './dto/agreement_template.dto';

@ApiTags('Agreement')
@Controller('agreement_template')
@ApiBearerAuth()
export class AgreementTemplateController {
  constructor(
    private readonly agreementTemplateService: AgreementTemplateService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  // @ApiResponse({ status: _200, description: 'Agreement added successfully.' })
  async addAgreementTemplate(
    @Request() req,
    @Body() addAgreementTemplateDTO: AddAgreementTemplateDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const agreementTemplate =
        await this.agreementTemplateService.addAgreementTemplate(
          addAgreementTemplateDTO,
          req.user.id,
          req.user.db_name,
          i18n
        );
      return successResponse(
        _200,
        i18n.t(`lang.agreement.register`),
        agreementTemplate,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Patch()
  @ApiResponse({ status: _200, description: 'Agreement updated successfully.' })
  async updateAgreementTemplate(
    @Request() req,
    @Body() updateAgreementTemplateDTO: UpdateAgreementTemplateDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const agreementTemplate =
        await this.agreementTemplateService.updateAgreementTemplate(
          updateAgreementTemplateDTO,
          req.user.id,
          req.user.db_name,
          i18n
        );
      return successResponse(
        _200,
        i18n.t(`lang.agreement.update`),
        agreementTemplate,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('customer_agreement')
  @ApiResponse({ status: _200, description: 'Get agreement successfully.' })
  async getAgreementTemplate(
    @Request() req,
    @Body() getAgreementTemplateDto: GetAgreementTemplateDto,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const agreementTemplate =
        await this.agreementTemplateService.getLoanAgreementTemplates(
          getAgreementTemplateDto,
          req.user.db_name,
          i18n
        );
      return successResponse(
        _200,
        i18n.t(`lang.agreement.get_all`),
        agreementTemplate,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get()
  @ApiResponse({ status: _200, description: 'Get agreement successfully.' })
  async getAllAgreementTemplate(
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const agreementTemplate =
        await this.agreementTemplateService.getAllAgreementTemplate(
          req.user.id,
          req.user.db_name,
        );
      return successResponse(
        _200,
        i18n.t(`lang.agreement.get_all`),
        agreementTemplate,
      );
    } catch (error) {
      errorResponse(error);
    }
  }
}

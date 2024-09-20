import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  errorResponse,
  PromiseResponse,
  successResponse,
} from 'src/utils/response.util';
import {
  Body,
  Controller,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { _200, _201, _400 } from 'src/utils/http-code.util';
import { NotificationTemplateService } from './notification_template.service';
import {
  AddNotificationTemplateDTO,
  GetNotificationTemplateDto,
  UpdateNotificationTemplateDTO,
} from './dto/notification_template.dto';

@ApiTags('notification template')
@Controller('notification_template')
@ApiBearerAuth()
export class NotificationTemplateController {
  constructor(
    private readonly notificationTemplateService: NotificationTemplateService,
  ) {}

  @Post()
  @ApiResponse({
    status: _200,
    description: 'Notification template added successfully.',
  })
  async addNotificationTemplate(
    @Request() req,
    @Body() addNotificationTemplateDTO: AddNotificationTemplateDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const NotificationTemplate =
        await this.notificationTemplateService.addNotificationTemplate(
          addNotificationTemplateDTO,
          req.user.id,
          req.user.db_name,
          i18n
        );
      return successResponse(
        _200,
        i18n.t(`lang.notification_template.register`),
        NotificationTemplate,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Patch()
  @ApiResponse({
    status: _200,
    description: 'Notification template updated successfully.',
  })
  async updateNotificationTemplate(
    @Request() req,
    @Body() updateNotificationTemplateDTO: UpdateNotificationTemplateDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const NotificationTemplate =
        await this.notificationTemplateService.updateNotificationTemplate(
          updateNotificationTemplateDTO,
          req.user.id,
          req.user.db_name,
        );
      return successResponse(
        _200,
        i18n.t(`lang.notification_template.update`),
        NotificationTemplate,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('get_notification')
  @ApiResponse({
    status: _200,
    description: 'Get Notification template successfully.',
  })
  async getNotificationTemplate(
    @Request() req,
    @Body() getNotificationTemplateDto: GetNotificationTemplateDto,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const NotificationTemplate =
        await this.notificationTemplateService.getNotificationsTemplate(
          req.user.id,
          req.user.db_name,
          getNotificationTemplateDto,
          i18n
        );
      return successResponse(
        _200,
        i18n.t(`lang.notification_template.get_all`),
        NotificationTemplate,
      );
    } catch (error) {
      errorResponse(error);
    }
  }
}

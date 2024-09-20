import { Body, Controller, Get, Patch, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StaffNotificationsService } from './staff_notifications.service';
import { _200 } from 'src/utils/http-code.util';
import { I18n, I18nContext } from 'nestjs-i18n';
import {
  errorResponse,
  PromiseResponse,
  successResponse,
} from 'src/utils/response.util';
import { GetStaffNotificationDTO, StaffNotificationDTO } from './dto/staff_notifications.dto';

@ApiTags('Staff notification')
@ApiBearerAuth()
@Controller('staff_notifications')
export class StaffNotificationsController {
  constructor(
    private readonly staffNotificationService: StaffNotificationsService,
  ) {}

  @Post('add_notification')
  @ApiResponse({
    status: _200,
    description: 'Notification created successfully.',
  })
  async addStaffNotification(
    @Body() staffNotificationDTO: StaffNotificationDTO,
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const customerNotification =
        await this.staffNotificationService.addStaffNotification(
          staffNotificationDTO,
          req.user.id,
          req.user.db_name,
        );
      return successResponse(
        _200,
        i18n.t(`lang.staff_notification.notification_added`),
        customerNotification,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get()
  @ApiResponse({
    status: _200,
    description: 'Notification retrieved successfully.',
  })
  async getStaffNotification(
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const customerNotification =
        await this.staffNotificationService.getStaffNotification(
          req.user?.store_id,
          req?.user?.id,
          req.user.db_name,
        );
      return successResponse(
        _200,
        i18n.t(`lang.staff_notification.notification_retrieved`),
        customerNotification,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Patch('read_notification')
  @ApiResponse({
    status: _200,
    description: 'Notification read successfully.',
  })
  async readNotification(
    @Body() getStaffNotificationDTO: GetStaffNotificationDTO,
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const customerNotification =
        await this.staffNotificationService.readNotification(
          getStaffNotificationDTO,
          req.user.id,
          req.user.db_name,
          i18n
        );
      return successResponse(
        _200,
        i18n.t(`lang.staff_notification.read_notification`),
        customerNotification,
      );
    } catch (error) {
      errorResponse(error);
    }
  }
}

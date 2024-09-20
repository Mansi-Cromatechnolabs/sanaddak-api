import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  errorResponse,
  PromiseResponse,
  successResponse,
} from 'src/utils/response.util';
import { Body, Controller, Post, Request } from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { _200, _201, _400 } from 'src/utils/http-code.util';
import { CustomerNotificationService } from './notification.service';
import {
  CustomerNotificationDTO,
  GetCustomerNotificationDTO,
} from './dto/notification.dto';

@ApiTags('Customer notification')
@Controller('customer_notification')
@ApiBearerAuth()
export class CustomerNotificationController {
  constructor(
    private readonly customerNotificationService: CustomerNotificationService,
  ) {}

  @Post('notifications')
  @ApiResponse({ status: _200, description: 'Get notification successfully.' })
  async getCustomerNotification(
    @Body() getCustomerNotificationDTO: GetCustomerNotificationDTO,
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const customerNotification =
        await this.customerNotificationService.getCustomerNotification(
          getCustomerNotificationDTO,
          req.user.id,
          req.user.db_name,
        );
      return successResponse(
        _200,
        i18n.t(`lang.customer_notification.get`),
        customerNotification,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('add_notification')
  @ApiResponse({
    status: _200,
    description: 'Added notification successfully.',
  })
  async addNotification(
    @Body() customerNotificationDTO: CustomerNotificationDTO,
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const customerNotification =
        await this.customerNotificationService.addNotification(
          customerNotificationDTO,
          req.user.id,
          req.user.db_name,
        );
      return successResponse(
        _200,
        i18n.t(`lang.customer_notification.add`),
        customerNotification,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('read_notification')
  @ApiResponse({
    status: _200,
    description: 'Added notification successfully.',
  })
  async readNotification(
    @Body() getCustomerNotificationDTO: GetCustomerNotificationDTO,
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const customerNotification =
        await this.customerNotificationService.readNotification(
          getCustomerNotificationDTO,
          req.user.id,
          req.user.db_name,
        );
      return successResponse(
        _200,
        i18n.t(`lang.customer_notification.read`),
        customerNotification,
      );
    } catch (error) {
      errorResponse(error);
    }
  }
}

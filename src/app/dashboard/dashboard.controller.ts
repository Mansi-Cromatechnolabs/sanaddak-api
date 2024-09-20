import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../auth/auth.service';
import { _200 } from 'src/utils/http-code.util';
import { errorResponse, successResponse } from 'src/utils/response.util';
import { I18n, I18nContext } from 'nestjs-i18n';
import { DeviceDTO } from './dtos/device-info.dto';
import { Public } from 'src/decorators/public.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  private jwtService: any;
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('device_info')
  @ApiResponse({
    status: _200,
  })
  async getDeviceInfo(
    @Headers('x-tenant-id') tenantId: string,
    @I18n() i18n: I18nContext,
    @Body() body: DeviceDTO,
  ) {
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );
      const DeviceInfo = await this.dashboardService.deviceInfo(body, db_name);
      return successResponse(
        _200,
        i18n.t(`lang.dashboard.get_device_info`),
        DeviceInfo,
      );
    } catch (error) {
      return errorResponse(error.message);
    }
  }
  @Public()
  @Post('dashboard_info')
  @ApiResponse({
    status: _200,
  })
  async getDashboardDetailsInfo(
    @Body() body: { token: string },
    @Headers('x-tenant-id') tenantId: string,
    @I18n() i18: I18nContext,
  ) {
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(tenantId)
      const InitResponse = await this.dashboardService.getInitInformation(db_name, body.token, i18)
      return successResponse(_200, i18.t(`lang.dashboard.get_dashboard_info`),InitResponse)
    } catch (error) {
      return errorResponse(error);
    }
  }
}

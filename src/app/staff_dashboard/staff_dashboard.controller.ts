import { Body, Controller, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { errorResponse, successResponse } from 'src/utils/response.util';
import { StaffDashboardService } from './staff_dashboard.service';
import { _200 } from 'src/utils/http-code.util';
import { I18n, I18nContext } from 'nestjs-i18n';
import { GetLoanEmiDTO } from './dtos/get_emi.dto';
import { GetLoanDTO } from './dtos/get_loan.dto';
import { GetAppointmentDTO } from './dtos/get_appointments.dto';

@Controller('staff_dashboard')
@ApiTags('Staff Dashboard')
@ApiBearerAuth()
export class StaffDashboardController {
  constructor(private readonly staffDashboard: StaffDashboardService) {}
  @Post('appointments')
  @ApiResponse({
    status: _200,
    description: 'All appointments is fetched ofr given stores.',
  })
  async getUpcomingAppointments(
    @Request() req: any,
    @Body() body: GetAppointmentDTO,
    @I18n() i18: I18nContext,
  ) {
    try {
      const AllAppointments = await this.staffDashboard.getAllAppointments(
        req.user.store_id,
        body,
        req.user.db_name,
        i18,
      );
      return successResponse(
        _200,
        i18.t(`lang.staff_dashboard.appointments`),
        AllAppointments,
      );
    } catch (error) {
      return errorResponse(error);
    }
  }
  @Post('up_coming_emi_loan')
  @ApiResponse({
    status: _200,
    description: 'All UpcomingEmi is fetched for given stores.',
  })
  async getUpcomingEmi(
    @Request() req: any,
    @Body() body: GetLoanEmiDTO,
    @I18n() i18: I18nContext,
  ) {
    try {
      const AllUpcomingEmi = await this.staffDashboard.getAllUpcomingEmi(
        req.user.store_id,
        req.user.db_name,
        body,
        i18,
      );
      return successResponse(
        _200,
        i18.t(`lang.staff_dashboard.up_coming_emi_loan`),
        AllUpcomingEmi,
      );
    } catch (error) {
      return errorResponse(error.message);
    }
  }
  @Post('loan_data')
  @ApiResponse({
    status: _200,
    description: 'All UpcomingEmi is fetched for given emi.',
  })
  async getLoanData(
    @Request() req: any,
    @Body() body: GetLoanDTO,
    @I18n() i18: I18nContext,
  ) {
    try {
      const LoanData = await this.staffDashboard.getLoanData(
        req.user.db_name,
        body,
        i18,
      );
      return successResponse(
        _200,
        i18.t(`lang.staff_dashboard.loan_data`),
        LoanData,
      );
    } catch (error) {
      return errorResponse(error.message);
    }
  }
  @Post('appointments_data')
  @ApiResponse({
    status: _200,
    description: 'All UpcomingEmi is fetched for given emi.',
  })
  async getAppointments(
    @Request() req: any,
    @Body() body: GetAppointmentDTO,
    @I18n() i18: I18nContext,
    @Query('type') type?: number,
  ) {
    try {
      const AppointmentsData = await this.staffDashboard.getAppointments(
        req.user.db_name,
        body,
        i18,
        type,
      );
      return successResponse(
        _200,
        i18.t(`lang.staff_dashboard.appointments_data`),
        AppointmentsData,
      );
    } catch (error) {
      return errorResponse(error.message);
    }
  }
}

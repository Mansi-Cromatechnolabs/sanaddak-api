import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppointmentService } from './services/appointment.service';
import { _200, _400 } from 'src/utils/http-code.util';
import { I18n, I18nContext } from 'nestjs-i18n';
import {
  errorResponse,
  PromiseResponse,
  successResponse,
} from 'src/utils/response.util';
import { StoreHolidayDTO, UpdateStoreHolidayDTO } from './dto/holiday.dto';
import { StoreHolidayService } from './services/store_holiday.service';
import { StoreAvailabilityService } from './services/store_availability.service';
import {
  UserAppointment,
  UserAppointmentDTO,
} from './dto/user_appointment.dto';
import {
  AppointmentAvailability,
  StoresDayDTO,
  TimeSlotDTO,
} from './dto/appointment_config.dto';
import { ApplicationStatusService } from './services/application_status.service';
import { ApplicationStatusDTO } from './dto/loan_application_status.dto';

@ApiTags('Appointment')
@Controller('appointment')
@ApiBearerAuth()
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly storeHolidayService: StoreHolidayService,
    private readonly storetAvailabilityService: StoreAvailabilityService,
    private readonly ApplicationStatusService: ApplicationStatusService,
  ) {}

  @Post('store_holiday')
  @ApiResponse({ status: _200, description: 'Holiday added successfully.' })
  async addStoreHoliday(
    @Request() req,
    @Body() storeHolidayDTO: StoreHolidayDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.storeHolidayService.addStoreHoliday(
        storeHolidayDTO,
        req.user.db_name,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.store.store_holiday_register_success`),
        user,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('store_holiday')
  @ApiResponse({
    status: _200,
    description: 'Holidays retrieved successfully.',
  })
  async getStoreHoliday(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Query('store_id') store_id?: string,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.storeHolidayService.getStoreHolidays(
        req.user.db_name,
        store_id,
        i18n,
      );
      if (user.message == i18n.t(`lang.store.no_holidays_found`)) {
        return successResponse(
          _400,
          i18n.t(`lang.store.no_holidays_found`),
          user.data,
        );
      }
      return successResponse(
        _200,
        i18n.t(`lang.store.store_holiday_retrieve_success`),
        user,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Patch('store_holiday')
  @ApiResponse({ status: _200, description: 'Holidays updated successfully.' })
  async updateStoreHoliday(
    @Request() req,
    @Body() updateHolidayDTO: UpdateStoreHolidayDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.storeHolidayService.updateHoliday(
        updateHolidayDTO,
        req.user.db_name,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.store.store_holiday_update_success`),
        user,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Delete('store_holiday')
  @ApiResponse({ status: _200, description: 'Holiday deleted successfully.' })
  async deleteStoreHoliday(
    @Request() req,
    @Body() updateHolidayDTO: UpdateStoreHolidayDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.storeHolidayService.deleteHoliday(
        updateHolidayDTO,
        req.user.db_name,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.store.store_holiday_delete_success`),
        user.data,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('appointment_availability')
  @ApiResponse({
    status: _200,
    description: 'Appointment availability added successfully.',
  })
  async ad1dStoreHoliday(
    @Request() req,
    @Body() appointmentAvailabilityDTO: AppointmentAvailability,
    @I18n() i18n: I18nContext,
  ): Promise<any> {
    try {
      const createdbranchDayAvailability =
        await this.storetAvailabilityService.createAppointmentAvailability(
          appointmentAvailabilityDTO,
          req.user.db_name,
          i18n,
        );
      return successResponse(
        _200,
        i18n.t(`lang.appointment.timeslot_added`),
        createdbranchDayAvailability,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('days_status')
  @ApiResponse({
    status: _200,
    description: 'Timeslots retrieved successfully.',
  })
  async getDaysStatus(
    @Request() req,
    @Body() storesDayDTO: StoresDayDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const appointment = await this.storetAvailabilityService.getDaysStatus(
        i18n,
        storesDayDTO,
        req.user.db_name,
      );
      return successResponse(
        _200,
        i18n.t(`lang.appointment.get_days`),
        appointment,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('get_appointment_slot_details')
  @ApiResponse({
    status: _200,
    description: 'Timeslots retrieved successfully.',
  })
  async getDaysAppointment(
    @Request() req,
    @Body() storesDayDTO: StoresDayDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const appointment =
        await this.storetAvailabilityService.getDaysAppointment(
          i18n,
          storesDayDTO,
          req.user.db_name,
        );
      return successResponse(
        _200,
        i18n.t(`lang.appointment.day_slots`),
        appointment,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('time_slot')
  @ApiResponse({
    status: _200,
    description: 'Timeslots retrieved successfully.',
  })
  async getSlotDetails(
    @Request() req,
    @Body() storesDayDTO: StoresDayDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const appointment = await this.storetAvailabilityService.getSlotDetails(
        storesDayDTO,
        req.user.db_name,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.appointment.day_slots`),
        appointment,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Delete('time_slot')
  async deleteDayAppointment(
    @Request() req,
    @Body() timeSlotDTO: TimeSlotDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const appointment =
        await this.storetAvailabilityService.deleteTimeSlotDTO(
          timeSlotDTO,
          req.user.db_name,
          i18n,
        );
      return successResponse(
        _200,
        i18n.t(`lang.appointment.slot_delete`),
        appointment.data,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('book_appointment')
  @ApiResponse({ status: _200, description: 'Appointment added successfully.' })
  async bookUserAppointMent(
    @Request() req,
    @Body() userAppointmentDTO: UserAppointmentDTO,
    @I18n() i18n: I18nContext,
    @Query('customer_id') customer_id?: string,
  ): Promise<PromiseResponse> {
    let user_id: string;
    if (customer_id) {
      user_id = customer_id;
    } else {
      user_id = req.user.id;
    }
    try {
      const user = await this.appointmentService.bookUserAppointMent(
        userAppointmentDTO,
        user_id,
        req.user.db_name,
        req.user.id,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.appointment.appointment_book_success`),
        user,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('appointment_list')
  @ApiResponse({
    status: _200,
    description: 'Appointment retrieved successfully.',
  })
  async getUserAppointMent(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Query('customer_id') customer_id?: string,
  ): Promise<PromiseResponse> {
    let user_id: string;
    if (customer_id) {
      user_id = customer_id;
    } else {
      user_id = req.user.id;
    }
    try {
      const user = await this.appointmentService.getUserAllAppointMents(
        user_id,
        req.user.db_name,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.appointment.appointment_retrieve_success`),
        user,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get()
  @ApiResponse({
    status: _200,
    description: 'Appointment retrieved successfully.',
  })
  async getAllAppointMents(
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.appointmentService.getAllAppointMents(
        req.user.db_name,
        req.user.store_id,
      );
      return successResponse(
        _200,
        i18n.t(`lang.appointment.appointment_retrieve_success`),
        user,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('valuation_list')
  @ApiResponse({
    status: _200,
    description: 'Appointment retrieved successfully.',
  })
  async getAppointMentValuations(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Query('appointment_id') appointment_id: string,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.appointmentService.getAppointMentValuations(
        appointment_id,
        req.user.db_name,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.appointment.appointment_retrieve_success`),
        user,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Patch('application_status')
  @ApiResponse({
    status: _200,
    description: 'Application status updated successfully.',
  })
  async updateApplicationStatus(
    @Request() req,
    @Body() applicationStatusDTO: ApplicationStatusDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const applicationStatus =
        await this.ApplicationStatusService.updateApplicationStatus(
          applicationStatusDTO,
          req.user.db_name,
          i18n,
          req.user.store_id,
        );
      if (applicationStatus.message === i18n.t('lang.kyc.user_not_verified')) {
        throw new BadRequestException(i18n.t('lang.kyc.user_not_verified'));
      } else if (
        applicationStatus.message === i18n.t('lang.kyc.user_kyc_not_approved')
      ) {
        throw new BadRequestException(i18n.t('lang.kyc.user_kyc_not_approved'));
      }
      return successResponse(
        _200,
        i18n.t(`lang.appointment.application_status_update`),
        applicationStatus,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('application_status')
  @ApiResponse({
    status: _200,
    description: 'Application status get successfully.',
  })
  async getApplicationStatus(
    @Request() req,
    @Query('loan_id') loan_id: string,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const applicationStatus =
        await this.ApplicationStatusService.getLoanApplicationStatus(
          loan_id,
          req.user.db_name,
        );
      return successResponse(
        _200,
        i18n.t(`lang.appointment.application_status_get`),
        applicationStatus,
      );
    } catch (error) {
      errorResponse(error);
    }
  }
}

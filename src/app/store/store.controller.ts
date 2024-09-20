import {
  Controller,
  Post,
  Body,
  Request,
  Headers,
  Patch,
  Delete,
  Get,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Public } from 'src/decorators/public.decorator';
import { _200, _400, _401, _404 } from 'src/utils/http-code.util';
import {
  PromiseResponse,
  errorResponse,
  successResponse,
} from 'src/utils/response.util';
import { StoreService } from './store.service';
import { StoreRegisterDTO, StoreUpdateDTO } from './dto/store_register.dto';
import { StoreLocationDTO } from './dto/store-locations.dto';
import { StoreRemoveDTO } from './dto/store_remove.dto';
import { StaffService } from '../staff/staff.service';
import { StoreHolidayService } from '../appointment/services/store_holiday.service';
import { StoreAvailabilityService } from '../appointment/services/store_availability.service';
import { AuthService } from '../auth/auth.service';
import { RolePermissionService } from '../role-permission/role-permission.service';

@ApiTags('Branch')
@Controller('branch')
@ApiBearerAuth()
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly staffService: StaffService,
    private readonly authService: AuthService,
    private readonly storeHolidayService: StoreHolidayService,
    private readonly storetAvailabilityService: StoreAvailabilityService,
    private readonly rolePermissionService: RolePermissionService,
  ) {}

  @Post('register')
  @ApiResponse({ status: 200, description: 'New store Registered.' })
  async storeRegistration(
    @Request() req,
    @Body() storeRegisterDTO: StoreRegisterDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const store_exists = await this.storeService.getStorename(
        storeRegisterDTO.name,
        req.user.db_name,
      );
      if (store_exists) {
        return successResponse(200, i18n.t('lang.store.store_exists'), {});
      }
      const role = await this.rolePermissionService.getRoleByName(
        req.user.db_name,
        'store-owner',
        i18n,
      );
      const staff = await this.authService.tanantUserRegistration(
        {
          store_id: null,
          franchise: null,
          first_name: storeRegisterDTO.store_owner_details.first_name,
          last_name: storeRegisterDTO.store_owner_details.last_name,
          email: storeRegisterDTO.store_owner_details.email,
          country_code: storeRegisterDTO.store_owner_details.country_code,
          mobile_number: storeRegisterDTO.store_owner_details.phone,
          password: null,
          is_active: true,
          is_admin: false,
          not_deletable: true,
          role_id: [role.id],
          staff_id: null,
          profile_image: null
        },
        req.user.db_name,
        i18n,
      );

      if (!staff) {
        return successResponse(
          200,
          i18n.t('lang.store.register_staff_fail'),
          {},
        );
      }

      const store = await this.storeService.storeRegistration(
        {
          ...storeRegisterDTO,
          branch_owner_id: staff?.id,
        },
        req.user.db_name,
        i18n,
      );

      if (!store) {
        return successResponse(
          200,
          i18n.t('lang.store.register_store_fail'),
          {},
        );
      }

      let holidays: any[] = [];
      let availability: any[] = [];

      if (storeRegisterDTO.holiday_details) {
        const holidayPromises = storeRegisterDTO.holiday_details.map(
          (holiday) =>
            this.storeHolidayService.addStoreHoliday(
              {
                name: holiday.name,
                holiday_date: holiday.holiday_date,
                store_id: store?._id,
              },
              req.user.db_name,
              i18n,
            ),
        );
        holidays = await Promise.all(holidayPromises);
      }

      if (storeRegisterDTO.days_avaibility) {
        const appointmentAvailabilityPromises =
          storeRegisterDTO.days_avaibility.map((item) =>
            this.storetAvailabilityService.createAppointmentAvailability(
              {
                day: item.day,
                is_open: item.is_open,
                slots: item.slots.map((slot) => ({
                  start_time: slot.start_time,
                  end_time: slot.end_time,
                  max_attendee: slot.max_attendee,
                })),
                store_id: store.id,
                day_master_id: '',
              },
              req.user.db_name,
              i18n,
            ),
          );
        availability = await Promise.all(appointmentAvailabilityPromises);
      }

      // staff.password = password;
      return successResponse(200, i18n.t('lang.store.register'), {});
    } catch (error) {
      errorResponse(error);
    }
  }

  @Delete('delete')
  @ApiResponse({ status: 200, description: 'Store Deleted.' })
  async storeRemove(
    @Request() req,
    @Body() storeRemoveDTO: StoreRemoveDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const store = await this.storeService.storeRemove(
        storeRemoveDTO,
        req.user.db_name,
        i18n,
      );
      if (store) {
        return successResponse(200, i18n.t(`lang.store.delete`), store);
      } else {
        return successResponse(200, i18n.t(`lang.store.delete_fail`), {});
      }
    } catch (error) {
      errorResponse(error);
    }
  }

  @Patch('update')
  @ApiResponse({ status: 200, description: 'Store updated.' })
  async updateStore(
    @Request() req,
    @Body() storeUpdateDTO: StoreUpdateDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const store = await this.storeService.updateStore(
        storeUpdateDTO,
        req.user.db_name,
        i18n,
      );
      if (store) {
        return successResponse(200, i18n.t(`lang.store.update`), store);
      } else {
        return successResponse(200, i18n.t(`lang.store.update_fail`), {});
      }
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('branch_list')
  @ApiResponse({
    status: 200,
    description: 'Branch list display Successfully.',
  })
  async branchList(
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const store = await this.storeService.branchList(
        req.user.db_name,
        req.user.store_id,
        i18n,
      );
      if (store) {
        return successResponse(200, i18n.t(`lang.store.listing`), store);
      } else {
        return successResponse(200, i18n.t(`lang.store.listing_fail`), {});
      }
    } catch (error) {
      errorResponse(error);
    }
  }

  @Public()
  @Post('store_locations')
  @ApiResponse({ status: _200, description: 'Store locations listing' })
  async storeLocations(
    @Request() req,
    @Headers('x-tenant-id') tanantid: string,
    @Body() storeLocationDTO: StoreLocationDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const tanant = await this.authService.getTanantBySubdomain(
        tanantid,
        true,
      );

      const store = await this.storeService.storeLocations(
        storeLocationDTO,
        tanant.db_name,
        i18n,
      );
      if (store) {
        return successResponse(
          _200,
          i18n.t(`lang.store.store_locations`),
          store,
        );
      } else {
        return successResponse(_200, i18n.t(`lang.store.not_found`), {});
      }
    } catch (error) {
      errorResponse(error);
    }
  }
}

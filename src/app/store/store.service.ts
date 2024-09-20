import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { date_moment } from 'src/utils/date.util';
import mongoose, { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Branch, StoreSchema } from './Schema/store.schema';
import { StoreRegisterDTO, StoreUpdateDTO } from './dto/store_register.dto';
import { StoreLocationDTO } from './dto/store-locations.dto';
import { calculateLatLngRange } from 'src/utils/coordinate_range.util';
import { distance } from 'src/utils/location_sort.util';
import { StoreRemoveDTO } from './dto/store_remove.dto';
import { PAGINATE } from 'src/config/constant.config';
import { AppointmentService } from '../appointment/services/appointment.service';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400, _404 } from 'src/utils/http-code.util';
import { AuthService } from '../auth/auth.service';
import { RolePermissionService } from '../role-permission/role-permission.service';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';

@Injectable({ scope: Scope.REQUEST })
export class StoreService {
  public storeModel: Model<any>;

  constructor(
    @Inject(forwardRef(() => AppointmentService))
    private readonly appointmentService: AppointmentService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly rolePermissionService: RolePermissionService,
  ) {}

  async getStoreById(id: string, db_name: string): Promise<any> {
    this.storeModel = setTanantConnection(db_name, Branch.name, StoreSchema);
    let store;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      store = await this.storeModel.findById({ _id: id }).exec();
    }
    return store ? store : false;
  }

  async getStoreDetails(id: string, db_name: string): Promise<any> {
    this.storeModel = setTanantConnection(db_name, Branch.name, StoreSchema);
    let store;
    store = await this.storeModel.findOne({ _id: id }).exec();

    return store ? store : false;
  }

  async storeRegistration(
    storeRegisterDTO: StoreRegisterDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.storeModel = setTanantConnection(db_name, Branch.name, StoreSchema);
    const existingStore = await this.storeModel.findOne({
      name: storeRegisterDTO.name,
    });

    if (existingStore) {
      throw new BadRequestException(i18n.t('lang.store.store_exists'));
    }

    let uniqueBranchKey = false;
    let branchKey: string;
    do {
      branchKey = Math.random().toString(36).substr(2, 3).toUpperCase();
      const existingStoreWithBranchKey = await this.storeModel.findOne({
        branch_key: branchKey,
      });
      if (!existingStoreWithBranchKey) {
        uniqueBranchKey = true;
      }
    } while (!uniqueBranchKey);

    storeRegisterDTO.branch_key = branchKey;
    storeRegisterDTO.registration_date = date_moment();
    const newStore = new this.storeModel(storeRegisterDTO);

    const savedStore = await newStore.save();

    await this.authService.updateStaffBranchId(
      db_name,
      savedStore?.branch_owner_id,
      savedStore?.id,
    );
    return savedStore;
  }

  async storeLocations(
    storeLocationDTO: StoreLocationDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.storeModel = setTanantConnection(db_name, Branch.name, StoreSchema);
    const skip = (storeLocationDTO.page - 1) * PAGINATE.LIMIT;
    if (storeLocationDTO.latitude && storeLocationDTO.longitude) {
      const cordinateRange = calculateLatLngRange(
        storeLocationDTO.latitude,
        storeLocationDTO.longitude,
      );
      const StoresInRange = await this.storeModel
        .find({
          $and: [
            {
              'location.latitude': {
                $gte: cordinateRange.minLatitude,
                $lte: cordinateRange.maxLatitude,
              },
            },
            {
              'location.longitude': {
                $gte: cordinateRange.minLongitude,
                $lte: cordinateRange.maxLongitude,
              },
            },
            {
              is_active: true,
            },
          ],
        })
        .skip(skip)
        .limit(PAGINATE.LIMIT);

      if (!StoresInRange || StoresInRange.length === 0) {
        throw new BadRequestException(
          i18n.t('lang.store.store_location_not_found'),
        );
      }

      return {
        store: await distance(storeLocationDTO, StoresInRange),
        page: Math.ceil(StoresInRange.length / PAGINATE.LIMIT),
      };
    } else if (
      storeLocationDTO.latitude === 0.0 &&
      storeLocationDTO.longitude === 0.0
    ) {
      const stores = await this.storeModel
        .find({
          is_active: true,
        })
        .skip(skip)
        .limit(PAGINATE.LIMIT);

      if (!stores || stores.length === 0) {
        throw new BadRequestException(
          i18n.t('lang.store.store_location_not_found'),
        );
      }

      const storesWithRoute = stores.map((store) => ({
        ...store.toObject(),
        location: {
          ...store.location,
          route: {
            distance: {
              text: '',
              value: 0,
            },
            duration: {
              text: '',
              value: 0,
            },
            status: '',
          },
        },
      }));

      return {
        store: storesWithRoute,
        page: Math.ceil(stores.length / PAGINATE.LIMIT),
      };
    }

    throw new BadRequestException(
      i18n.t('lang.store.invalid_location_parameters'),
    );
  }

  async branchList(
    db_name: string,
    store_id: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.storeModel = setTanantConnection(db_name, Branch.name, StoreSchema);

    const store = await this.storeModel
      .aggregate([
        ...(store_id
          ? [{ $match: { _id: new mongoose.Types.ObjectId(store_id) } }]
          : []),
        {
          $lookup: {
            from: 'Staff',
            localField: 'branch_owner_id',
            foreignField: '_id',
            as: 'store_owner_details',
          },
        },
        {
          $unwind: '$store_owner_details',
        },
        {
          $lookup: {
            from: 'storeholidays',
            localField: '_id',
            foreignField: 'store_id',
            as: 'store_holiday_details',
          },
        },
        {
          $lookup: {
            from: 'branchdayavailabilities',
            localField: '_id',
            foreignField: 'store_id',
            as: 'store_day_availabilities_details',
          },
        },
        {
          $project: {
            _id: 1,
            branch_owner_id: 1,
            name: 1,
            address: 1,
            location: 1,
            is_never_delete: 1,
            is_active: 1,
            branch_key: 1,
            owner: {
              first_name: '$store_owner_details.first_name',
              last_name: '$store_owner_details.last_name',
              email: '$store_owner_details.email',
              country_code: '$store_owner_details.country_code',
              phone: '$store_owner_details.phone',
            },
            holidays: {
              $map: {
                input: '$store_holiday_details',
                as: 'holiday',
                in: {
                  name: '$$holiday.name',
                  holiday_date: '$$holiday.holiday_date',
                },
              },
            },
            day_availabilities: {
              $map: {
                input: '$store_day_availabilities_details',
                as: 'day_availability',
                in: {
                  day: '$$day_availability.day',
                  is_open: '$$day_availability.is_open',
                },
              },
            },
          },
        },
      ])
      .exec();

    if (!store || store.length === 0) {
      throw new BadRequestException(i18n.t('lang.store.not_found'));
    }

    return store;
  }

  async storeRemove(
    storeRemoveDTO: StoreRemoveDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.storeModel = setTanantConnection(db_name, Branch.name, StoreSchema);
    const existingHoliday = await this.storeModel.findById({
      _id: storeRemoveDTO.store_id,
    });
    const checkLoanBooking =
      await this.appointmentService.getAppointmentByStoreId(
        storeRemoveDTO.store_id,
        db_name,
      );

    if (!existingHoliday) {
      throw new NotFoundException(i18n.t('lang.store.not_found'));
    }
    if (!checkLoanBooking.is_branch_visited) {
      await this.storeModel
        .findByIdAndUpdate(
          { _id: storeRemoveDTO.store_id },
          { is_delete: true, is_active: false },
          { new: true },
        )
        .exec();
    } else {
      throw new BadRequestException(i18n.t('lang.store.store_not_visited'));
    }
    return {};
  }

  async updateStore(
    storeUpdateDTO: StoreUpdateDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.storeModel = setTanantConnection(db_name, Branch.name, StoreSchema);
    const existingStore = await this.storeModel
      .findById(storeUpdateDTO.store_id)
      .exec();

    if (!existingStore) {
      throw new NotFoundException(i18n.t('lang.store.not_found'));
    }

    const existingName = await this.storeModel.findOne({
      name: storeUpdateDTO.name,
      _id: { $ne: storeUpdateDTO.store_id }, // exclude the current store
    });

    if (existingName) {
      throw new BadRequestException(i18n.t('lang.store.store_exists'));
    }

    const updatedStore = await this.storeModel
      .findByIdAndUpdate(
        storeUpdateDTO.store_id,
        { $set: storeUpdateDTO },
        { new: true },
      )
      .exec();
    return updatedStore;
  }

  async getStorename(name: string, db_name: string): Promise<any> {
    this.storeModel = setTanantConnection(db_name, Branch.name, StoreSchema);
    const existingStore = await this.storeModel.findOne({
      name: name,
    });
    return existingStore ? existingStore : false;
  }
}

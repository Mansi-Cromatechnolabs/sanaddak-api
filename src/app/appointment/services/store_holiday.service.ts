import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Model } from 'mongoose';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400, _404 } from 'src/utils/http-code.util';
import { StoreHoliday, StoreHolidaySchema } from '../schema/holidays_schema';
import { StoreHolidayDTO, UpdateStoreHolidayDTO } from '../dto/holiday.dto';
import { I18nContext } from 'nestjs-i18n';
import { Branch, StoreSchema } from 'src/app/store/Schema/store.schema';

@Injectable()
export class StoreHolidayService {
  public storeHolidayModel: Model<any>;
  public branchModel: Model<Branch>;

  constructor() {}

  async addStoreHoliday(
    storeHolidayDTO: StoreHolidayDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.storeHolidayModel = setTanantConnection(
      db_name,
      StoreHoliday.name,
      StoreHolidaySchema,
    );
    const { holiday_date,store_id } = storeHolidayDTO;
    const existingHoliday = await this.storeHolidayModel
      .findOne({ holiday_date, store_id })
      .exec();
    if (existingHoliday) {
      throw new BadRequestException(i18n.t(`lang.store.store_holiday_exist`));
    }

    const holiday = new this.storeHolidayModel({ ...storeHolidayDTO });
    await holiday.save();

    return holiday;
  }

  async getStoreHolidays(db_name: string, store_id: string, i18n: I18nContext): Promise<StoreHoliday[] | any> {
    this.storeHolidayModel = setTanantConnection(
      db_name,
      StoreHoliday.name,
      StoreHolidaySchema,
    );
    const store_holiday = await this.storeHolidayModel.find({store_id:store_id}).exec();

    if (store_holiday.length === 0) {
      return {
        message: i18n.t(`lang.store.no_holidays_found`),
        data: {},
      };
    }
    return store_holiday;
  }

  async updateHoliday(
    updateHolidayDTO: UpdateStoreHolidayDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<StoreHoliday> {
    this.storeHolidayModel = setTanantConnection(
      db_name,
      StoreHoliday.name,
      StoreHolidaySchema,
    );
    const existingHoliday = await this.storeHolidayModel
      .findById(updateHolidayDTO.id)
      .exec();
    if (!existingHoliday) {
      throw new BadRequestException(i18n.t(`lang.store.no_holidays_found`));
    }
    this.branchModel = setTanantConnection(db_name, Branch.name, StoreSchema )
    
    if(updateHolidayDTO.store_id){
      const store = await this.branchModel.findOne({ _id: updateHolidayDTO?.store_id }).exec();
      if (!store) {
        throw new BadRequestException(i18n.t(`lang.store.not_found`));
      }
    }
 

    const updatedHoliday = await this.storeHolidayModel
      .findByIdAndUpdate(
        updateHolidayDTO.id,
        { $set: updateHolidayDTO },
        { new: true },
      )
      .exec();
    return updatedHoliday;
  }

  async getStoreHoliday(id: string, db_name: string): Promise<any> {
    this.storeHolidayModel = setTanantConnection(
      db_name,
      StoreHoliday.name,
      StoreHolidaySchema,
    );
    let user;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await this.storeHolidayModel.findById({ _id: id }).exec();
    }
    return user ? user : false;
  }

  async deleteHoliday(
    updateHolidayDTO: UpdateStoreHolidayDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.storeHolidayModel = setTanantConnection(
      db_name,
      StoreHoliday.name,
      StoreHolidaySchema,
    );
    const existingHoliday = await this.getStoreHoliday(
      updateHolidayDTO.id,
      db_name,
    );
    if (!existingHoliday) {
      throw new NotFoundException(i18n.t(`lang.store.no_holidays_found`));
    }

    await this.storeHolidayModel.findByIdAndDelete(updateHolidayDTO.id).exec();
    return {
      data: {},
    };
  }
}

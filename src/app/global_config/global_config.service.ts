import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Model } from 'mongoose';
import {
  GlobalConfig,
  GlobalConfigSchema,
} from './schema/global_config.schema';
import { GetGlobalConfig, GlobalConfigDTO } from './dto/global_config.dto';
import { date_moment } from 'src/utils/date.util';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';

@Injectable()
export class GlobalConfigService {
  public globalConfigModel: Model<any>;

  constructor() {}

  async addGlobalConfig(
    globalConfigDTO: GlobalConfigDTO,
    user_id: string,
    db_name: string,
  ): Promise<GlobalConfig> {
    this.globalConfigModel = setTanantConnection(
      db_name,
      GlobalConfig.name,
      GlobalConfigSchema,
    );
    const existingGlobalConfig = await this.globalConfigModel
      .findOne({ key: globalConfigDTO.key })
      .exec();

    globalConfigDTO.update_date = date_moment();
    if (existingGlobalConfig) {
      globalConfigDTO.updated_by = user_id;
      Object.assign(existingGlobalConfig, globalConfigDTO);
      await existingGlobalConfig.save();
      return existingGlobalConfig;
    } else {
      globalConfigDTO.created_by = user_id;
      const newConfig = new this.globalConfigModel(globalConfigDTO);
      await newConfig.save();
      return newConfig;
    }
  }

  async getGlobalConfig(
    getGlobalConfig: GetGlobalConfig,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.globalConfigModel = setTanantConnection(
      db_name,
      GlobalConfig.name,
      GlobalConfigSchema,
    );

    if (!getGlobalConfig.key) {
      const globalConfigs = await this.globalConfigModel.find().exec();
      return globalConfigs;
    }
    
    const existingGlobalConfig = await this.globalConfigModel
      .findOne({ key: getGlobalConfig.key })
      .exec();
    if (!existingGlobalConfig) {
      throw new BadRequestException(i18n.t(`lang.global_config.config_failed`));
    }
    return existingGlobalConfig?.value;
  }
}

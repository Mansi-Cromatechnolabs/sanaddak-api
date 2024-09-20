import { BadRequestException, Injectable } from '@nestjs/common';
import { date_moment } from 'src/utils/date.util';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { GlobalConfigDTO } from '../global_config/dto/global_config.dto';
import {
  GlobalConfig,
  GlobalConfigSchema,
} from '../global_config/schema/global_config.schema';
import { UserService } from '../user/user.service';

@Injectable()
export class GlobalConfigSeeder {
  globalConfigModel: import('mongoose').Model<
    any,
    unknown,
    unknown,
    {},
    any,
    any
  >;

  constructor(private readonly userService: UserService) { }

  async addGlobalConfig(
    globalConfigDTO: GlobalConfigDTO,
    db_name: string,
  ): Promise<GlobalConfig | false> {
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
      Object.assign(existingGlobalConfig, globalConfigDTO);
      await existingGlobalConfig.save();
      return existingGlobalConfig;
    } else {
      const newConfig = new this.globalConfigModel(globalConfigDTO);
      await newConfig.save();
      return newConfig;
    }
  }


  async seed(db_name: string) {
    const global_config_data = [
      {
        type: 'appointment',
        key: 'appointment_show_days',
        value: '14',
      },
      {
        type: 'appointment',
        key: 'tenure',
        value: ['3'],
      },
      {
        type: 'date',
        key: 'global_date_time_format',
        value: 'dd-MMM-yyyy',
      },
      {
        type: 'Lock the rate',
        key: 'lock_the_rate',
        value: true,
      },
      {
        type: 'Tag price config',
        key: 'minimum_range_percentage',
        value: 5,
      },
      {
        type: 'Tag price config',
        key: 'maximum_range_percentage',
        value: 3,
      },
      {
        type: 'Tag price config',
        key: 'avearage_price_days',
        value: 2,
      },
    ];

    const user = await this.userService.findTanantUserByEmail(
      db_name,
      process.env.DEFAULT_STAFF_EMAIL_4_SEEDER,
    );
    if (!user) {
      throw new BadRequestException("User not Found")
    }
    for (const config of global_config_data) {
      await this.addGlobalConfig(
        {
          type: config.type,
          key: config.key,
          value: config.value,
          created_by: user?.id,
        } as GlobalConfigDTO,
        db_name,
      );
    }
  }
}

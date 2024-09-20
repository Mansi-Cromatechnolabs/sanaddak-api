import { Injectable } from '@nestjs/common';
import { date_moment } from 'src/utils/date.util';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { PriceCofigDTO } from '../gold_loan/dto/price_config.dto';
import { PriceConfig, PriceConfigSchema } from '../gold_loan/schema/price_config.schema';
import { TagService } from '../gold_loan/tag.service';
import { UserService } from '../user/user.service';

@Injectable()
export class PriceConfigSeeder {
  priceConfigModel: import("mongoose").Model<any, unknown, unknown, {}, any, any>;
  constructor(private readonly tagService: TagService,
    private readonly userService: UserService
  ) { }

  async addApprovedPriceConfig(
    priceCofigDTO: PriceCofigDTO,
    user_id: string,
    db_name: string,
  ): Promise<PriceConfig | any> {
    this.priceConfigModel = setTanantConnection(
      db_name,
      PriceConfig.name,
      PriceConfigSchema,
    );
    const existingConfig = await this.priceConfigModel
      .findOne({ tag_id: priceCofigDTO.tag_id })
      .exec();
    if(existingConfig){
      return false
    }
    priceCofigDTO.config_update_date = date_moment();
    priceCofigDTO.updated_by = user_id;
    if (existingConfig) {
      Object.assign(existingConfig, priceCofigDTO);
      await existingConfig.save();
      return existingConfig;
    } else {
      const newConfig = new this.priceConfigModel(priceCofigDTO);
      await newConfig.save();
      return newConfig;
    }
  }

  async seed(db_name: string) {
    const tag = await this.tagService.getTagByName("Egypt", db_name);
    let user = await this.userService.findTanantUserByEmail(db_name, process.env.DEFAULT_STAFF_EMAIL_4_SEEDER);
    await this.addApprovedPriceConfig({ tag_id: tag?.['_id'], margin_rate: 3.75, gold_price_24_karate: 3600, reserve_rate: 50, admin_fee_rate: 3.50, admin_fee_rate_renewal: 1.50, penalty_rate: 10, } as PriceCofigDTO, user?.id, db_name)
  }
}

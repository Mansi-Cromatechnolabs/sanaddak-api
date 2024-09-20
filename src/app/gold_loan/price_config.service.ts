import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import mongoose, { Model } from 'mongoose';
import { PriceConfig, PriceConfigSchema } from './schema/price_config.schema';
import { GetPriceConfig, PriceCofigDTO } from './dto/price_config.dto';
import { date_moment } from 'src/utils/date.util';
import { TagService } from './tag.service';
import { CustomerTagService } from 'src/customer/service/customer_tag.service';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400 } from 'src/utils/http-code.util';
import { GoldLoanService } from './gold_loan.service';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';
import axios from 'axios';
import { GlobalConfigService } from '../global_config/global_config.service';
import {
  PriceConfigLogs,
  PriceConfigLogsSchema,
} from './schema/price_config_log.schema';
import { PriceCofigLogDTO } from './dto/price_config_log.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminConfigService {
  public priceConfigModel: Model<any>;
  public priceConfigLogModel: Model<any>;

  constructor(
    private readonly tagService: TagService,
    private readonly customerTagService: CustomerTagService,
    @Inject(forwardRef(() => GoldLoanService))
    private readonly goldLoanService: GoldLoanService,
    @Inject(forwardRef(() => GlobalConfigService))
    private readonly globalConfigService: GlobalConfigService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  async getPriceLog(tag_id: string, db_name: string) {
    this.priceConfigLogModel = setTanantConnection(
      db_name,
      PriceConfigLogs.name,
      PriceConfigLogsSchema,
    );
    const exisingLog = await this.priceConfigLogModel
      .findOne({ tag_id: tag_id })
      .sort({ config_update_date: -1 })
      .exec();

    if (exisingLog) {
      return exisingLog;
    } else {
      return {
        tag_id: tag_id,
        requested_gold_price: '',
        margin_rate: '',
        reserve_rate: '',
        admin_fee_rate: '',
        admin_fee_rate_renewal: '',
        config_update_date: '',
        penalty_rate: '',
        user_role_permission: '',
        status: '',
      };
    }
  }

  async addPriceConfigLog(
    priceCofigLogDTO: PriceCofigLogDTO,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<PriceConfig | any> {
    this.priceConfigLogModel = setTanantConnection(
      db_name,
      PriceConfigLogs.name,
      PriceConfigLogsSchema,
    );

    const exisingLog = await this.priceConfigLogModel.findOne({
      tag_id: new mongoose.Types.ObjectId(priceCofigLogDTO.tag_id),
      is_request_proceeded: false,
    });
    const [is_maker, is_checker, is_approver] = await Promise.all([
      this.authService.getUserPermissions(
        user_id,
        'priceTag.maker',
        db_name,
        i18n,
      ),
      this.authService.getUserPermissions(
        user_id,
        'priceTag.checker',
        db_name,
        i18n,
      ),
      this.authService.getUserPermissions(
        user_id,
        'priceTag.approver',
        db_name,
        i18n,
      ),
    ]);

    if (!exisingLog) {
      if (is_maker) {
        priceCofigLogDTO.status = 1;
        priceCofigLogDTO.user_role_permission = 1;
        const newConfig = new this.priceConfigLogModel(priceCofigLogDTO);
        await newConfig.save();
        return newConfig;
      }
    } else {
      if (exisingLog.status === 1 && is_checker) {
        priceCofigLogDTO.status = 2;
        priceCofigLogDTO.user_role_permission = 2;
        const newConfig = new this.priceConfigLogModel(priceCofigLogDTO);
        await newConfig.save();

        exisingLog.is_request_proceeded = true;
        await exisingLog.save();
        return newConfig;
      } else if (exisingLog.status === 2 && is_approver) {
        priceCofigLogDTO.status = 3;
        priceCofigLogDTO.user_role_permission = 3;
        const newConfig = new this.priceConfigLogModel(priceCofigLogDTO);
        await newConfig.save();

        exisingLog.is_request_proceeded = true;
        await exisingLog.save();

        await this.addApprovedPriceConfig(
          {
            ...priceCofigLogDTO,
            gold_price_24_karate: priceCofigLogDTO.requested_gold_price,
            is_active: true,
          },
          user_id,
          db_name,
        );
        newConfig.is_request_proceeded = true;
        await newConfig.save();

        await this.tagService.updateTagStatus(
          priceCofigLogDTO.tag_id,
          user_id,
          true,
          db_name,
          i18n,
        );
        return newConfig;
      }
    }
    return {};
  }

  async addApprovedPriceConfig(
    priceCofigDTO: PriceCofigDTO,
    user_id: string,
    db_name: string,
  ): Promise<PriceConfig> {
    this.priceConfigModel = setTanantConnection(
      db_name,
      PriceConfig.name,
      PriceConfigSchema,
    );
    const existingConfig = await this.priceConfigModel
      .findOne({ tag_id: priceCofigDTO.tag_id })
      .exec();
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
  async addAdminConfig(
    priceCofigDTO: PriceCofigDTO,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<PriceConfig> {
    this.priceConfigModel = setTanantConnection(
      db_name,
      PriceConfig.name,
      PriceConfigSchema,
    );
    const tag = await this.tagService.getTag(priceCofigDTO.tag_id, db_name);
    if (tag === false) {
      throw new BadRequestException(
        i18n.t(`lang.gold_loan.price_config_valid_tag`),
      );
    }
    await this.validateGoldPrice(
      priceCofigDTO.gold_price_24_karate,
      priceCofigDTO.tag_id,
      db_name,
      i18n,
    );

    priceCofigDTO.config_update_date = date_moment();
    const price_config_log = await this.addPriceConfigLog(
      {
        ...priceCofigDTO,
        requested_gold_price: priceCofigDTO.gold_price_24_karate,
        updated_by: user_id,
        status: null,
        user_role_permission: null,
      },
      user_id,
      db_name,
      i18n,
    );
    return price_config_log;
  }

  async validateGoldPrice(
    gold_price: number,
    tag_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    try {
      this.priceConfigLogModel = setTanantConnection(
        db_name,
        PriceConfigLogs.name,
        PriceConfigLogsSchema,
      );

      const response = await axios.get(
        'https://data-asg.goldprice.org/GetData/EGP-XAU/1',
        {
          headers: {
            'User-Agent': '',
            Accept: 'application/json',
          },
        },
      );

      const dataString = response.data[0];
      const [_, price] = dataString.split(',');
      const current_gold_price = parseFloat(
        (parseFloat(price) / 31.1034).toFixed(2),
      );

      const [minRangePercentage, maxRangePercentage, pastPriceDay] =
        await Promise.all([
          this.globalConfigService.getGlobalConfig(
            { key: 'minimum_range_percentage' },
            db_name,
            i18n,
          ),
          this.globalConfigService.getGlobalConfig(
            { key: 'maximum_range_percentage' },
            db_name,
            i18n,
          ),
          this.globalConfigService.getGlobalConfig(
            { key: 'avearage_price_days' },
            db_name,
            i18n,
          ),
        ]);
      const endDate = date_moment();
      const startDate = date_moment();
      startDate.setDate(endDate.getDate() - pastPriceDay);

      const recentPriceConfigs = await this.priceConfigLogModel
        .find({
          tag_id: tag_id,
          status: 3,
          config_update_date: {
            $gte: startDate.toISOString(),
            $lte: endDate.toISOString(),
          },
        })
        .exec();

      let last_average_rate;
      if (recentPriceConfigs.length === 0) last_average_rate = 0;
      const total = recentPriceConfigs.reduce(
        (sum, config) => sum + config.requested_gold_price,
        0,
      );
      last_average_rate = total / recentPriceConfigs.length;

      const requestedGoldPrice = parseFloat(
        (gold_price * (1 - parseFloat(minRangePercentage) / 100)).toFixed(2),
      );
      const minGoldPrice = parseFloat(
        (
          current_gold_price *
          (1 - parseFloat(minRangePercentage) / 100)
        ).toFixed(2),
      );
      const maxGoldPrice = parseFloat(
        (
          current_gold_price *
          (1 + parseFloat(maxRangePercentage) / 100)
        ).toFixed(2),
      );
      if (
        requestedGoldPrice > last_average_rate ||
        gold_price < minGoldPrice ||
        gold_price > maxGoldPrice
      ) {
        throw new BadRequestException(i18n.t(`lang.gold_loan.price_not_valid`));
      }
      return {
        current_gold_price,
        minGoldPrice,
        maxGoldPrice,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async checkPriceConfigLock(
    tag_id: string,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.priceConfigLogModel = setTanantConnection(
      db_name,
      PriceConfigLogs.name,
      PriceConfigLogsSchema,
    );

    const exisingLog = await this.priceConfigLogModel.findOne({
      tag_id: new mongoose.Types.ObjectId(tag_id),
      is_request_proceeded: false,
    });

    const [is_maker, is_checker, is_approver] = await Promise.all([
      this.authService.getUserPermissions(
        user_id,
        'priceTag.maker',
        db_name,
        i18n,
      ),
      this.authService.getUserPermissions(
        user_id,
        'priceTag.checker',
        db_name,
        i18n,
      ),
      this.authService.getUserPermissions(
        user_id,
        'priceTag.approver',
        db_name,
        i18n,
      ),
    ]);

    if (exisingLog) {
      if (is_checker === true && exisingLog.status === 1) {
        return false;
      } else if (is_approver === true && exisingLog.status === 2) {
        return false;
      } else {
        return true;
      }
    } else {
      if (is_maker === true) {
        return false;
      } else {
        return true;
      }
    }
  }

  async getAdminConfig(
    getPriceConfig: GetPriceConfig,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<PriceConfig | any> {
    this.priceConfigModel = setTanantConnection(
      db_name,
      PriceConfig.name,
      PriceConfigSchema,
    );

    const tagExists = await this.tagService.getTag(
      new mongoose.Types.ObjectId(getPriceConfig.tag_id),
      db_name,
    );
    if (tagExists === false) {
      throw new BadRequestException(
        i18n.t(`lang.gold_loan.price_config_valid_tag`),
      );
    }

    const existingConfig = await this.priceConfigModel
      .findOne({ tag_id: getPriceConfig.tag_id })
      .exec();

    const is_locked = await this.checkPriceConfigLock(
      getPriceConfig.tag_id,
      user_id,
      db_name,
      i18n,
    );

    const requested_price = await this.getPriceLog(
      getPriceConfig.tag_id,
      db_name,
    );
    const users = await this.getPriceConfigLogUser(
      getPriceConfig.tag_id,
      db_name,
    );
    if (existingConfig) {
      return {
        tag_id: getPriceConfig.tag_id,
        is_locked: is_locked,
        status: requested_price?.status || '',
        is_active: tagExists?.['is_active'] || false,
        existing_price: {
          ...existingConfig.toObject(),
        },
        requested_price,
        maker: users.maker,
        checker: users.checker,
        requested_maker: users.requested_maker,
      };
    } else {
      return {
        tag_id: getPriceConfig.tag_id,
        is_locked,
        status: requested_price?.status || '',
        is_active: tagExists?.['is_active'] || false,
        existing_price: {
          margin_rate: '',
          gold_price_24_karate: '',
          reserve_rate: '',
          admin_fee_rate: '',
          admin_fee_rate_renewal: '',
          config_update_date: '',
          penalty_rate: '',
        },
        requested_price,
        maker: users.maker,
        checker: users.checker,
        requested_maker: users.requested_maker,
      };
    }
  }

  async getPriceConfig(
    getPriceConfig: GetPriceConfig,
    db_name: string,
    i18n: I18nContext,
  ): Promise<PriceConfig | any> {
    this.priceConfigModel = setTanantConnection(
      db_name,
      PriceConfig.name,
      PriceConfigSchema,
    );

    const tagExists = await this.tagService.getTag(
      getPriceConfig.tag_id,
      db_name,
    );
    if (tagExists === false) {
      throw new BadRequestException(
        i18n.t(`lang.gold_loan.price_config_valid_tag`),
      );
    }

    const existingConfig = await this.priceConfigModel
      .findOne({ tag_id: getPriceConfig.tag_id })
      .exec();
    if (existingConfig) {
      return existingConfig;
    } else {
      return {
        _id: '',
        tag_id: getPriceConfig.tag_id,
        margin_rate: '',
        gold_price_24_karate: '',
        reserve_rate: '',
        admin_fee_rate: '',
        admin_fee_rate_renewal: '',
        config_update_date: '',
      };
    }
  }

  async getPriceConfigLogUser(tag_id: string, db_name: string): Promise<any> {
    this.priceConfigLogModel = setTanantConnection(
      db_name,
      PriceConfigLogs.name,
      PriceConfigLogsSchema,
    );
    const requested_price = await this.getPriceLog(tag_id, db_name);
    let maker;
    let checker;
    let requested_maker;
    let maker_request_date;
    let checker_update_date;
    if (requested_price.status === 1) {
      (maker = await this.authService.getUserProfile(
        requested_price.updated_by,
        db_name,
      )),
        (maker_request_date = requested_price.config_update_date);
    } else if (requested_price.status === 2) {
      checker = await this.authService.getUserProfile(
        requested_price.updated_by,
        db_name,
      );
      checker_update_date = requested_price.config_update_date;
      requested_maker = await this.priceConfigLogModel
        .findOne({
          tag_id: new mongoose.Types.ObjectId(tag_id),
          status: requested_price.status - 1,
        })
        .sort({ config_update_date: -1 })
        .exec();
      maker_request_date = requested_maker.config_update_date;
      maker = await this.authService.getUserProfile(
        requested_maker.updated_by,
        db_name,
      );
    }

    return {
      maker: {
        _id: maker?._id,
        user_role_permission: 1,
        full_name: `${maker?.first_name} ${maker?.last_name}`,
        email: maker?.email || '',
        profile_image: maker?.profile_image || '',
        config_update_date: maker_request_date || '',
      },
      checker: {
        _id: checker?._id,
        user_role_permission: 2,
        full_name: `${checker?.first_name} ${checker?.last_name}`,
        email: checker?.email || '',
        profile_image: checker?.profile_image || '',
        config_update_date: checker_update_date || '',
      },
      requested_maker: requested_maker ? requested_maker : {},
    };
  }

  async getCustomerPriceConfig(
    customer_id: string,
    db_name,
    i18n: I18nContext,
  ): Promise<PriceConfig | any> {
    this.priceConfigModel = setTanantConnection(
      db_name,
      PriceConfig.name,
      PriceConfigSchema,
    );

    const tag = await this.customerTagService.getTagByCustomerId(
      customer_id,
      db_name,
    );

    if (tag === false) {
      return this.goldLoanService.getDefaultPriceConfig(db_name);
    }
    const customerPriceConfig = await this.getPriceConfig(
      { tag_id: tag },
      db_name,
      i18n,
    );
    return customerPriceConfig;
  }

  async getPriceConfigLog(
    tag_id: string,
    db_name: string,
  ): Promise<PriceConfigLogs[] | any> {
    this.priceConfigLogModel = setTanantConnection(
      db_name,
      PriceConfigLogs.name,
      PriceConfigLogsSchema,
    );

    const price_config_log = await this.priceConfigLogModel
      .aggregate([
        {
          $match: { tag_id: new mongoose.Types.ObjectId(tag_id) },
        },
        {
          $addFields: {
            updated_by_object_id: {
              $convert: {
                input: '$updated_by',
                to: 'objectId',
                onError: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: 'Staff',
            localField: 'updated_by_object_id',
            foreignField: '_id',
            as: 'user_details',
          },
        },
        {
          $unwind: {
            path: '$user_details',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            'user_details.full_name': {
              $concat: [
                { $ifNull: ['$user_details.first_name', ''] },
                ' ',
                { $ifNull: ['$user_details.last_name', ''] },
              ],
            },
            'user_details.mobile_number': {
              $concat: [
                { $ifNull: ['$user_details.country_code', ''] },
                { $ifNull: ['$user_details.mobile_number', ''] },
              ],
            },
          },
        },
        {
          $project: {
            _id: 1,
            tag_id: 1,
            requested_gold_price: 1,
            config_update_date: 1,
            admin_fee_rate: 1,
            admin_fee_rate_renewal: 1,
            gold_price_24_karate: 1,
            margin_rate: 1,
            reserve_rate: 1,
            liquidation_cost: 1,
            penalty_rate: 1,
            status: 1,
            user_role_permission: 1,
            user_details: {
              _id: 1,
              full_name: 1,
              mobile_number: 1,
              email: { $ifNull: ['$user_details.email', ''] },
              profile_image: { $ifNull: ['$user_details.profile_image', ''] },
            },
          },
        },
        {
          $sort: { config_update_date: -1 },
        },
      ])
      .exec();
    if (!price_config_log) {
      return false;
    }
    return price_config_log;
  }
}

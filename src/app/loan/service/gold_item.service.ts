import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { Loan, LoanSchema } from '../schema/loan.schema';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';

import { GoldLoanService } from 'src/app/gold_loan/gold_loan.service';
import { GoldItemDTO } from '../dto/gold_item.dto';
import { GoldItem, GoldItemSchema } from '../schema/gold_item.schema';
import { I18nContext } from 'nestjs-i18n';
import { CustomerService } from 'src/customer/service/customer.service';
import {
  LoanAppointMentBooking,
  LoanAppointMentBookingSchema,
} from '../../appointment/schema/user_appointment.schema';
import { Customer, CustomerSchema } from 'src/customer/schema/customer.schema';
import {
  InitialValuations,
  InitialValuationSchema,
} from '../../gold_loan/schema/customer_loan_estimation.schema';
import { CustomerTagService } from 'src/customer/service/customer_tag.service';
import { BarcodeService } from './barcode.service';

@Injectable()
export class GoldItemService {
  public loanModel: Model<any>;
  public goldItemModel: Model<any>;
  public loanEmiModel: Model<any>;
  public appointmentModel: Model<any>;
  public customerModel: Model<any>;
  public valuationModel: Model<any>;

  constructor(
    @Inject(forwardRef(() => GoldLoanService))
    private readonly goldLoanService: GoldLoanService,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => CustomerTagService))
    private readonly customerTagService: CustomerTagService,
    @Inject(forwardRef(() => BarcodeService))
    private readonly barcodeService: BarcodeService,
  ) {}

  async addGoldItem(
    goldItemDTO: GoldItemDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<GoldItem | any> {
    this.goldItemModel = setTanantConnection(
      db_name,
      GoldItem.name,
      GoldItemSchema,
    );
    const existingitem = await this.goldItemModel
      .findOne({
        valuation_id: goldItemDTO.valuation_id,
      })
      .exec();

    if (!existingitem) {
      const newItem = new this.goldItemModel({
        ...goldItemDTO,
        asset_images: goldItemDTO.asset_images,
      });
      await newItem.save();

      if(goldItemDTO?.barcode_number){
        await this.barcodeService.generateGoldPieceBarcode(goldItemDTO?.barcode_number,goldItemDTO?.liquidate_number,db_name,i18n,newItem?.id)
      }
     
      return newItem;
    } else {
      throw new BadRequestException(i18n.t(`lang.loan.item_exist`));
    }
  }

  async getCustomerLoanDetails(
    db_name: string,
    customer_id: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);

    const result = await this.loanModel
      .aggregate([
        { $match: { customer_id: new mongoose.Types.ObjectId(customer_id) } },
        {
          $lookup: {
            from: 'customer',
            localField: 'customer_id',
            foreignField: '_id',
            as: 'customer',
          },
        },
        { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'initialvaluations',
            localField: 'valuation_id',
            foreignField: '_id',
            as: 'valuations',
          },
        },
        { $unwind: { path: '$valuations', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'loanemis',
            let: { loan_id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$loan_id', '$$loan_id'] },
                  emi_status: 'pending',
                },
              },
              { $sort: { emi_number: 1 } },
              { $limit: 1 },
            ],
            as: 'first_installment',
          },
        },
        {
          $unwind: {
            path: '$first_installment',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: null,
            liquidity_details: {
              $push: {
                liquidate_number: '$liquidate_number',
                liquidity_id: '$_id',
                gold_rate_at_valuation: '$gold_rate_at_valuation',
                cash_to_customer: '$cash_to_customer',
                available_liquidity_to_customer:
                  '$available_liquidity_to_customer',
                tenure_in_months: '$tenure_in_months',
                total_margin: '$margin',
                margin_rate: '$margin_rate',
                gold_weight: '$gold_weight',
                gold_purity_entered_per_1000: '$gold_purity_entered_per_1000',
                installment_value: {
                  $ifNull: ['$first_installment.emi_amount', 0],
                },
                next_emi_payment_date: {
                  $ifNull: ['$first_installment.emi_payment_date', null],
                },
              },
            },
            customer: {
              $first: {
                customer_id: { $ifNull: ['$customer._id', ''] },
                full_name: {
                  $concat: ['$customer.first_name', ' ', '$customer.last_name'],
                },
                mobile_number: {
                  $concat: ['$customer.country_code', '$customer.phone'],
                },
                email: { $ifNull: ['$customer.email', ''] },
                address: { $ifNull: ['$customer.address', ''] },
                profile_image: { $ifNull: ['$customer.profile_image', ''] },
              },
            },
            valuations: {
              $push: {
                valuation_id: '$valuations._id',
                customer_id: '$valuations.customer_id',
                cash_to_customer: '$valuations.cash_to_customer',
                customer_cash_needs: '$valuations.customer_cash_needs',
                gold_rate_at_valuation: '$valuations.gold_rate_at_valuation',
                gold_weight: '$valuations.gold_weight',
                valuation_number: '$valuations.valuation_number',
                tenure: '$valuations.tenure_in_months',
                gold_purity_entered_per_1000:
                  '$valuations.gold_purity_entered_per_1000',
                available_liquidity_to_customer:
                  '$valuations.available_liquidity_to_customer',
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            liquidity_details: 1,
            customer: 1,
            valuations: { $ifNull: ['$valuations', []] },
          },
        },
      ])
      .exec();
    const customer = await this.customerService.getUserProfile(
      customer_id,
      db_name,
    );
    const tags = await this.customerTagService.getCustomerTags(
      { customer_id },
      db_name,
    );
    if (result.length === 0) {
      return {
        liquidity_details: [],
        customer: {
          customer_id: customer?._id || '',
          full_name: `${customer.first_name} ${customer.last_name}`,
          email: customer?.email || '',
          mobile_number: `${customer?.country_code} ${customer?.phone}`,
          address: customer?.['address'] || '',
          profile_image: customer?.profile_image || '',
        },
        valuations: [],
        tags,
      };
    }

    const [data] = result;
    data.tags = tags ? tags : [];
    data.liquidity_details = await Promise.all(
      data.liquidity_details.map(async (item) => ({
        ...item,
        gold_rate_at_valuation: await this.goldLoanService.formatCurrency(
          item.gold_rate_at_valuation,
          i18n,
        ),
        total_margin: await this.goldLoanService.formatCurrency(
          item.total_margin,
          i18n,
        ),
        cash_to_customer: await this.goldLoanService.formatCurrency(
          item.cash_to_customer,
          i18n,
        ),
        available_liquidity_to_customer:
          await this.goldLoanService.formatCurrency(
            item.available_liquidity_to_customer,
            i18n,
          ),
        tenure_in_months: `${item.tenure_in_months} ${i18n.t('lang.gold_loan.months')}`,
        installment_value: await this.goldLoanService.formatCurrency(
          item.installment_value,
          i18n,
        ),
      })),
    );

    data.valuations = await Promise.all(
      data.valuations.map(async (item) => {
        if (Object.keys(item).length > 0) {
          return {
            ...item,
            cash_to_customer: item.cash_to_customer
              ? await this.goldLoanService.formatCurrency(
                  item.cash_to_customer,
                  i18n,
                )
              : item.cash_to_customer,
            customer_cash_needs: item.customer_cash_needs
              ? await this.goldLoanService.formatCurrency(
                  item.customer_cash_needs,
                  i18n,
                )
              : item.customer_cash_needs,
            gold_rate_at_valuation: item.gold_rate_at_valuation
              ? await this.goldLoanService.formatCurrency(
                  item.gold_rate_at_valuation,
                  i18n,
                )
              : item.gold_rate_at_valuation,
            tenure: item.tenure
              ? `${item.tenure} ${i18n.t('lang.gold_loan.months')}`
              : item.tenure,
          };
        }
        return null;
      }),
    );
    data.valuations = data.valuations.filter((item) => item !== null);

    return data;
  }

  async getGlobalSearch(
    db_name: string,
    id: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    this.appointmentModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );
    this.valuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );

    const formattedPhoneNumber = id.replace(' ', '');
    const [loanResult, appointmentResult, valuationResult, customerResult] =
      await Promise.all([
        this.loanModel
          .aggregate([{ $match: { liquidate_number: id } }, { $limit: 1 }])
          .exec(),

        this.appointmentModel
          .aggregate([{ $match: { booking_number: id } }, { $limit: 1 }])
          .exec(),

        this.valuationModel
          .aggregate([{ $match: { valuation_number: id } }, { $limit: 1 }])
          .exec(),

        this.customerModel
          .aggregate([
            {
              $match: {
                $or: [
                  { phone: id, is_active: true, is_deleted: false },
                  {
                    $expr: {
                      $eq: [{ $concat: ['$country_code', '$phone'] }, `+${id}`],
                    },
                    is_active: true,
                    is_deleted: false,
                  },
                  {
                    $expr: {
                      $eq: [{ $concat: ['$country_code', '$phone'] }, `${id}`],
                    },
                    is_active: true,
                    is_deleted: false,
                  },
                  {
                    $expr: {
                      $eq: [
                        { $concat: ['$country_code', '$phone'] },
                        `+${formattedPhoneNumber}`,
                      ],
                    },
                    is_active: true,
                    is_deleted: false,
                  },
                  {
                    $expr: {
                      $eq: [
                        { $concat: ['$country_code', '$phone'] },
                        `${formattedPhoneNumber}`,
                      ],
                    },
                    is_active: true,
                    is_deleted: false,
                  },
                ],
              },
            },
            { $limit: 1 },
          ])
          .exec(),
      ]);

    const matchedId =
      loanResult[0]?._id?.toString() ||
      appointmentResult[0]?._id?.toString() ||
      valuationResult[0]?._id?.toString() ||
      customerResult[0]?._id?.toString() ||
      null;

    const responseData =
      valuationResult.length > 0
        ? {
            customer_id: valuationResult[0]?.customer_id || '',
            cash_to_customer: await this.goldLoanService.formatCurrency(
              valuationResult[0]?.cash_to_customer,
              i18n,
            ),
            customer_cash_needs: await this.goldLoanService.formatCurrency(
              valuationResult[0]?.customer_cash_needs,
              i18n,
            ),
            gold_weight: valuationResult[0]?.gold_weight || '',
            gold_purity_entered_per_1000:
              valuationResult[0]?.gold_purity_entered_per_1000 || '',
            tenure: `${valuationResult[0]?.tenure_in_months} ${i18n.t('lang.gold_loan.months')}`,
          }
        : {
            id: matchedId,
            ...(appointmentResult[0]?._id?.toString()
              ? {
                  appointment_type:
                    appointmentResult[0]?.appointment_type || '',
                }
              : {}),
            ...(appointmentResult[0]?._id?.toString()
              ? { liquidity_id: appointmentResult[0]?.loan_id || '' }
              : {}),
          };

    return responseData;
  }

  async getGoldItem(
    valuation_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<GoldItem | any> {
    this.goldItemModel = setTanantConnection(
      db_name,
      GoldItem.name,
      GoldItemSchema,
    );
    const existingitem = await this.goldItemModel
      .find({
        valuation_id: valuation_id,
      })
      .exec();
    return existingitem;
  }
}

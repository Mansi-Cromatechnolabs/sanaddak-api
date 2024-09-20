import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DeviceDTO } from './dtos/device-info.dto';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { DeviceInfo, DeviceInfoSchema } from './schema/device-info.schema';
import { Model } from 'mongoose';
import { Customer, CustomerSchema } from 'src/customer/schema/customer.schema';
import { JwtService } from '@nestjs/jwt';
import {
  PriceConfig,
  PriceConfigSchema,
} from '../gold_loan/schema/price_config.schema';
import { Tag, TagSchema } from '../gold_loan/schema/tag.schema';
import {
  UserKycDetails,
  UserKycDetailsSchema,
} from '../gold_loan/schema/kyc_details.schema';
import {
  LoanAppointMentBooking,
  LoanAppointMentBookingSchema,
} from '../appointment/schema/user_appointment.schema';
import { formatCurrency } from 'src/utils/formate.util';
import { I18nContext } from 'nestjs-i18n';
import { Loan, LoanSchema } from '../loan/schema/loan.schema';
import {
  InitialValuations,
  InitialValuationSchema,
} from '../gold_loan/schema/customer_loan_estimation.schema';
import { CustomerNotificationService } from '../notification/notification.service';
import { GlobalConfigService } from '../global_config/global_config.service';

@Injectable()
export class DashboardService {
  private deviceModel: Model<DeviceInfo>;
  private userModel: Model<Customer>;
  private kycDetailsModel: Model<UserKycDetails>;
  private LoanModel: Model<Loan>;
  private priceConfigModel: Model<PriceConfig>;
  private tagModel: Model<Tag>;
  private appointmentModel: Model<LoanAppointMentBooking>;
  private initialValuationModel: Model<InitialValuations>;

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => CustomerNotificationService))
    private readonly customerNotificationService: CustomerNotificationService,
    @Inject(forwardRef(() => GlobalConfigService))
    private readonly globalConfigService: GlobalConfigService,
  ) {}
  async deviceInfo(deviceInfo: DeviceDTO, db_name: string) {
    this.deviceModel = setTanantConnection(
      db_name,
      DeviceInfo.name,
      DeviceInfoSchema,
    );

    const existingDevice = await this.deviceModel
      .findOne({ device_id: deviceInfo.device_id })
      .exec();

    if (existingDevice) {
      existingDevice.last_login_datetime = new Date();
      await existingDevice.save();
      return await existingDevice.save();
    } else {
      const newDevice = new this.deviceModel({
        ...deviceInfo,
        last_login_datetime: new Date(),
      });

      return await newDevice.save();
    }
  }
  async getInitInformation(db_name: string, token: string, i18n: I18nContext) {
    const getModel = (modelName: string, schema: any) =>
      setTanantConnection(db_name, modelName, schema);

    this.priceConfigModel = getModel(PriceConfig.name, PriceConfigSchema);
    this.tagModel = getModel(Tag.name, TagSchema);
    this.initialValuationModel = getModel(
      InitialValuations.name,
      InitialValuationSchema,
    );

    // Fetch gold price
    const tag = await this.tagModel.findOne({
      name: 'Egypt',
      delete_date: null,
    });
    const priceConfig = await this.priceConfigModel.findOne({
      tag_id: tag._id,
    });
    const gold_price_24_karate = priceConfig?.gold_price_24_karate || 0;

    let user,
      valuation_count,
      Emis = [],
      appointment = [];
    const kyc_process_method = await this.globalConfigService.getGlobalConfig(
      { key: 'kyc_process' },
      db_name,
      i18n,
    );

    if (token) {
      this.userModel = getModel(Customer.name, CustomerSchema);
      this.kycDetailsModel = getModel(
        UserKycDetails.name,
        UserKycDetailsSchema,
      );
      this.LoanModel = getModel(Loan.name, LoanSchema);
      this.appointmentModel = getModel(
        LoanAppointMentBooking.name,
        LoanAppointMentBookingSchema,
      );

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.SECRET_KEY,
      });
      user = await this.userModel.findById(payload.id);

      if (user) {
        user.kycInfo = await this.kycDetailsModel.findOne({
          customer_id: user._id,
        });

        // Fetch upcoming EMIs
        const emiResult = await this.LoanModel.aggregate([
          { $match: { customer_id: user._id, is_verified: true } },
          {
            $lookup: {
              from: 'loanemis',
              localField: '_id',
              foreignField: 'loan_id',
              as: 'loan_emis',
            },
          },
          { $unwind: { path: '$loan_emis', preserveNullAndEmptyArrays: true } },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      { $eq: ['$loan_emis.emi_status', 'pending'] },
                      { $eq: ['$loan_emis.emi_status', 'overdue'] },
                    ],
                  },
                ],
              },
            },
          },
          {
            $group: {
              _id: '$_id',
              customer_id: { $first: '$customer_id' },
              loan_amount: { $first: '$loan_amount' },
              loan_status: { $first: '$loan_status' },
              upcoming_emis: {
                $push: {
                  loan_emi_status: '$loan_emis.emi_status',
                  upcoming_payment_date: '$loan_emis.emi_payment_date',
                  loan_id: '$loan_emis.loan_id',
                  loan_number: '$liquidate_number',
                  installment_amount: '$loan_emis.emi_amount',
                  installment_no: '$loan_emis.emi_number',
                  emi_status: '$loan_emis.emi_status',
                },
              },
            },
          },
          { $project: { upcoming_emis: 1, _id: 0 } },
        ]);

        Emis = emiResult.flatMap((result) => {
          result.upcoming_emis.forEach(async (element) => {
            element.installment_amount = await formatCurrency(
              element.installment_amount,
              i18n,
            );
          });

          return result.upcoming_emis;
        });

        // Fetch upcoming appointments
        const appointments = await this.appointmentModel.aggregate([
          { $match: { customer_id: user._id } },
          // {
          //   $lookup: {
          //     from: 'branchtimeavailabilities',
          //     localField: 'time_slot_id',
          //     foreignField: '_id',
          //     as: 'time_slot',
          //   },
          // },
          // { $unwind: { path: '$time_slot', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'branches',
              localField: 'store_id',
              foreignField: '_id',
              as: 'store',
            },
          },
          { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              upcoming_appointment: {
                appointment_date: {
                  $dateToString: {
                    date: '$booking_date',
                    timezone: 'UTC',
                  },
                },
                start_time: {
                  $ifNull: ['$appointment_start_time', ''],
                },
                end_time: {
                  $ifNull: ['$appointment_end_time', ''],
                },
                store_id: '$store._id',
                store_name: '$store.name',
                is_branch_visited: '$is_branch_visited',
                booking_number: '$booking_number',
                store_address: '$store.address',
                store_latitude: '$store.location.latitude',
                store_longitude: '$store.location.longitude',
              },
            },
          },
        ]);

        appointment = appointments.map((a) => a.upcoming_appointment);
        const valuation_counts = await this.initialValuationModel.aggregate([
          {
            $match: {
              customer_id: user._id,
              loan_estimation_delete_date: null,
              is_completed: false,
            },
          },
          {
            $lookup: {
              from: 'loanappointmentbookings',
              localField: '_id',
              foreignField: 'valuation_id',
              as: 'appointment',
            },
          },
          {
            $match: {
              appointment: { $size: 0 },
            },
          },
          {
            $count: 'valuation_count',
          },
        ]);

        valuation_count = valuation_counts[0]?.valuation_count || 0;
      }
      const liquidity_status = await this.LoanModel.aggregate([
        { $match: { customer_id: user._id } },
        {
          $lookup: {
            from: 'initialvaluations',
            localField: 'valuation_id',
            foreignField: '_id',
            as: 'valuation_info',
          },
        },
        {
          $unwind: {
            path: '$valuation_info',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            'valuation_info.valuation_status': 5,
          },
        },
        {
          $project: {
            _id: 0,
            loan_id: '$_id',
          },
        },
      ]);
      const is_all_notification_read =
        await this.customerNotificationService.findCustomerUnreadNotification(
          user?._id,
          db_name,
        );
      return {
        gold_price_24_karate: await formatCurrency(gold_price_24_karate, i18n),
        is_all_notification_read: is_all_notification_read,
        is_notification: user.is_notification_enable,
        kyc_status: user?.kycInfo?.kyc_status,
        doc_type: user?.kycInfo?.document_type ?? '',
        doc_number: user?.kycInfo?.kyc_details.national_id ?? '',
        upcoming_emi: Emis,
        upcoming_appointments: appointment,
        valuation_count: valuation_count,
        liquidity_ids: liquidity_status.map((item) => item.loan_id),
        kyc_process_method: kyc_process_method
      };
    }

    return {
      gold_price_24_karate: await formatCurrency(gold_price_24_karate, i18n),
      is_notification: false,
      kyc_status: user?.kycInfo?.kyc_status,
      doc_type: user?.kycInfo?.document_type ?? '',
      doc_number: user?.kycInfo?.kyc_details.national_id ?? '',
      upcoming_emi: [],
      upcoming_appointments: [],
      valuation_count: 0,
      liquidity_ids: [],
      kyc_process_method: kyc_process_method
    };
  }
}

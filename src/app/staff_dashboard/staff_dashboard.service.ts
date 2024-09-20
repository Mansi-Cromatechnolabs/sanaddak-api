import { Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import {
  LoanAppointMentBooking,
  LoanAppointMentBookingSchema,
} from '../appointment/schema/user_appointment.schema';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { ObjectId } from 'mongodb';
import { Loan, LoanSchema } from '../loan/schema/loan.schema';
import { formatCurrency } from 'src/utils/formate.util';
import { I18nContext } from 'nestjs-i18n';
import { GetLoanEmiDTO } from './dtos/get_emi.dto';
import { PAYMENT_STATE } from 'src/config/constant.config';
import { GetLoanDTO } from './dtos/get_loan.dto';
import { GetAppointmentDTO } from './dtos/get_appointments.dto';
import {
  GlobalConfig,
  GlobalConfigSchema,
} from '../global_config/schema/global_config.schema';
import {
  date_moment,
  getNextDays,
  sub_days,
  TIMEZONE_UTC,
} from 'src/utils/date.util';
import { StoreHolidayService } from '../appointment/services/store_holiday.service';
import { Customer, CustomerSchema } from 'src/customer/schema/customer.schema';
import {
  InitialValuations,
  InitialValuationSchema,
} from '../gold_loan/schema/customer_loan_estimation.schema';
import { LoanService } from '../loan/service/loan.service';

@Injectable()
export class StaffDashboardService {
  private appointmentModel: Model<LoanAppointMentBooking>;
  private configModel: Model<GlobalConfig>;
  private loanModel: Model<Loan>;
  private customerModel: Model<Customer>;
  private initialValuationModel: Model<InitialValuations>;
  constructor(
    private readonly holidayService: StoreHolidayService,
    private readonly loanService: LoanService,
  ) {}
  async getAllAppointments(
    store_id: string,
    body: GetAppointmentDTO,
    db_name: string,
    i18n: I18nContext,
  ) {
    this.appointmentModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );
    this.configModel = setTanantConnection(
      db_name,
      GlobalConfig.name,
      GlobalConfigSchema,
    );
    const pipeline: any[] = [
      {
        $match: {
          store_id: new mongoose.Types.ObjectId(store_id),
          $or: [
            { is_branch_visited: { $exists: false } },
            { is_branch_visited: false },
          ],
        },
      },
      {
        $lookup: {
          from: 'customer',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $unwind: '$customer',
      },
      // {
      //   $lookup: {
      //     from: 'branchtimeavailabilities',
      //     localField: 'time_slot_id',
      //     foreignField: '_id',
      //     as: 'branch_time',
      //   },
      // },
      // {
      //   $unwind: '$branch_time',
      // },
      {
        $lookup: {
          from: 'initialvaluations',
          localField: 'valuation_id',
          foreignField: '_id',
          as: 'initial_valuation',
        },
      },
      {
        $addFields: {
          filtered_initial_valuation: {
            $cond: {
              if: { $gt: [{ $size: '$initial_valuation' }, 0] },
              then: {
                $filter: {
                  input: '$initial_valuation',
                  cond: {
                    $or: [
                      { $eq: ['$valuation_status', null] },
                      { $not: { $type: '$valuation_status' } },
                      { $lte: ['$valuation_status', 1] },
                    ],
                  },
                },
              },
              else: '$initial_valuation',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'loans',
          localField: 'loan_id',
          foreignField: '_id',
          as: 'loan_details',
        },
      },
      {
        $unwind: {
          path: '$loan_details',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          appointment_id: '$_id',
          store_id: 1,
          appointment_type: 1,
          time_slot_id: 1,
          liquidate_number: { $ifNull: ['$loan_details.liquidate_number', ''] },
          liquidity_id: { $ifNull: ['$loan_id', ''] },
          is_branch_visited: 1,
          customer_id: '$customer._id',
          first_name: '$customer.first_name',
          last_name: '$customer.last_name',
          profile_image: { $ifNull: ['$profile_image', ''] },
          valuation_number: {
            $map: {
              input: '$filtered_initial_valuation',
              as: 'valuation',
              in: '$$valuation.valuation_number',
            },
          },
          valuation_id: { $ifNull: ['$valuation_id', ''] },
          valuation_status: {
            $map: {
              input: '$filtered_initial_valuation',
              as: 'valuation',
              in: '$$valuation.valuation_status',
            },
          },
          booking_date: {
            $dateToString: {
              date: '$booking_date',
            },
          },
          booking_number: '$booking_number',
          start_time: {
            $ifNull: ['$appointment_start_time', ''],
          },
          end_time: {
            $ifNull: ['$appointment_end_time', ''],
          },
          start_time_minutes: {
            $function: {
              body: function (start_time) {
                if (!start_time) {
                  return null;
                }
                var timeParts = start_time.split(' ');
                var hourMinute = timeParts[0].split(':');
                var hour = parseInt(hourMinute[0]);
                var minute = parseInt(hourMinute[1]);
                var amPm = timeParts[1];
                if (amPm === 'PM' && hour !== 12) {
                  hour += 12;
                }
                return hour * 60 + minute;
              },
              args: ['$appointment_start_time'],
              lang: 'js',
            },
          },
        },
      },
      {
        $sort: {
          booking_date: 1,
          start_time_minutes: 1,
        },
      },
    ];

    const filterDate = body.date != '' ? new Date(body.date) : null;
    if (filterDate) {
      pipeline.splice(1, 0, {
        $match: {
          booking_date: {
            $eq: filterDate,
          },
        },
      });
    } else {
      pipeline.splice(1, 0, {
        $match: {
          booking_date: {
            $gte: sub_days(date_moment(), 1, TIMEZONE_UTC),
          },
        },
      });
    }
    const appointments = await this.appointmentModel.aggregate(pipeline);
    const nextDates = filterDate
      ? []
      : await this.getDays(db_name, store_id, i18n);
    return { appointments, nextDates };
  }

  async getAppointments(
    db_name: string,
    body: GetAppointmentDTO,
    i18: I18nContext,
    type?: number,
  ) {
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
    this.initialValuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );
    let pipeline: any[];
    let appointments;
    if (type == 1) {
      const pipeline = [
        {
          $match: {
            valuation_status: { $exists: true, $in: [1, 2] },
            customer_id: new mongoose.Types.ObjectId(body.id),
          },
        },
        {
          $lookup: {
            from: 'customer',
            localField: 'customer_id',
            foreignField: '_id',
            as: 'customerDetails',
          },
        },
        {
          $unwind: {
            path: '$customerDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'loanappointmentbookings',
            let: { valuationId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$$valuationId', '$valuation_id'],
                  },
                },
              },
            ],
            as: 'appointments',
          },
        },
        {
          $unwind: {
            path: '$appointments',
            preserveNullAndEmptyArrays: true,
          },
        },
        // {
        //   $lookup: {
        //     from: 'branchtimeavailabilities',
        //     localField: 'appointments.time_slot_id',
        //     foreignField: '_id',
        //     as: 'branchtimeavailabilities',
        //   },
        // },
        {
          $lookup: {
            from: 'userkycdetails',
            localField: 'customer_id',
            foreignField: 'customer_id',
            as: 'userkycdetails',
          },
        },
        {
          $unwind: {
            path: '$userkycdetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'Staff',
            let: { review_by_id: { $toObjectId: '$userkycdetails.review_by' } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$review_by_id'],
                  },
                },
              },
            ],
            as: 'reviewer',
          },
        },
        {
          $unwind: {
            path: '$reviewer',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$_id',
            customer_id: { $first: '$customer_id' },
            first_name: { $first: '$customerDetails.first_name' },
            last_name: { $first: '$customerDetails.last_name' },
            email: { $first: '$customerDetails.email' },
            phone: { $first: '$customerDetails.phone' },
            kyc_status: { $first: '$userkycdetails.kyc_status' },
            review_status: { $first: '$userkycdetails.review_status' },
            review_by: {
              $first: {
                $ifNull: [
                  {
                    $concat: [
                      { $ifNull: ['$reviewer.first_name', ''] },
                      ' ',
                      { $ifNull: ['$reviewer.last_name', ''] },
                    ],
                  },
                  '',
                ],
              },
            },
            valuation: {
              $push: {
                valuation_id: '$_id',
                valuation_status: '$valuation_status',
                cash_to_customer: '$cash_to_customer',
                available_liquidity_to_customer: {
                  $ifNull: ['$available_liquidity_to_customer', ''],
                },
                customer_cash_needs: '$customer_cash_needs',
                tenure_in_months: '$tenure_in_months',
                gold_weight: '$gold_weight',
                gold_purity_entered_per_1000: '$gold_purity_entered_per_1000',
                appointment_id: { $ifNull: ['$appointments._id', ''] },
                booking_number: {
                  $ifNull: ['$appointments.booking_number', ''],
                },
                booking_date: { $ifNull: ['$appointments.booking_date', ''] },
                start_time: {
                  $ifNull: ['$appointments.appointment_start_time', ''],
                },
                end_time: {
                  $ifNull: ['$appointments.appointment_end_time', ''],
                },
              },
            },
          },
        },
        {
          $addFields: {
            valuation: {
              $cond: {
                if: { $eq: [{ $size: '$valuation' }, 0] },
                then: [],
                else: '$valuation',
              },
            },
          },
        },
      ];
      appointments = await this.initialValuationModel.aggregate(pipeline);
      if (!appointments || appointments.length === 0) {
        appointments = await this.customerModel
          .aggregate([
            {
              $match: { _id: new mongoose.Types.ObjectId(body.id) },
            },
            {
              $lookup: {
                from: 'userkycdetails',
                localField: '_id',
                foreignField: 'customer_id',
                as: 'userkycdetails',
              },
            },
            {
              $unwind: {
                path: '$userkycdetails',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'Staff',
                let: {
                  review_by_id: { $toObjectId: '$userkycdetails.review_by' },
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', '$$review_by_id'],
                      },
                    },
                  },
                ],
                as: 'reviewer',
              },
            },
            {
              $unwind: {
                path: '$reviewer',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $group: {
                _id: '$_id',
                customer_id: { $first: '$_id' },
                first_name: { $first: '$first_name' },
                last_name: { $first: '$last_name' },
                email: { $first: { $ifNull: ['$email', ''] } },
                phone: {
                  $first: {
                    $concat: [
                      { $ifNull: ['$country_code', ''] },
                      { $ifNull: ['$phone', ''] },
                    ],
                  },
                },
                kyc_status: {
                  $first: { $ifNull: ['$userkycdetails.kyc_status', ''] },
                },
                review_status: {
                  $first: { $ifNull: ['$userkycdetails.review_status', ''] },
                },
                review_by: {
                  $first: {
                    $ifNull: [
                      {
                        $concat: [
                          { $ifNull: ['$reviewer.first_name', ''] },
                          ' ',
                          { $ifNull: ['$reviewer.last_name', ''] },
                        ],
                      },
                      '',
                    ],
                  },
                },
              },
            },
          ])
          .exec();
      }
    } else {
      pipeline = [
        {
          $match: {
            _id: new ObjectId(body.id),
          },
        },
        {
          $lookup: {
            from: 'customer',
            localField: 'customer_id',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $unwind: {
            path: '$customer',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'userkycdetails',
            localField: 'customer_id',
            foreignField: 'customer_id',
            as: 'userkycdetails',
          },
        },
        {
          $unwind: {
            path: '$userkycdetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'Staff',
            let: { review_by_id: { $toObjectId: '$userkycdetails.review_by' } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$review_by_id'],
                  },
                },
              },
            ],
            as: 'reviewer',
          },
        },
        {
          $unwind: {
            path: '$reviewer',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'initialvaluations',
            localField: 'valuation_id',
            foreignField: '_id',
            as: 'initialvaluations',
          },
        },
        {
          $unwind: {
            path: '$initialvaluations',
            preserveNullAndEmptyArrays: true,
          },
        },
        // {
        //   $lookup: {
        //     from: 'branchtimeavailabilities',
        //     localField: 'time_slot_id',
        //     foreignField: '_id',
        //     as: 'branchtimeavailabilities',
        //   },
        // },
        {
          $project: {
            customer_id: '$customer._id',
            first_name: '$customer.first_name',
            last_name: '$customer.last_name',
            email: '$customer.email',
            phone: '$customer.phone',
            profile_image: { $ifNull: ['$profile_image', ''] },
            valuation_type: '$appointment_type',
            booking_number: 1,
            booking_date: 1,
            start_time: { $ifNull: ['$appointment_start_time', ''] },
            end_time: { $ifNull: ['$appointments.appointment_end_time', ''] },
            kyc_status: { $ifNull: ['$userkycdetails.kyc_status', ''] },
            review_status: { $ifNull: ['$userkycdetails.review_status', ''] },
            liquidity_id: '$loan_id',
            review_by: {
              $ifNull: [
                {
                  $concat: [
                    { $ifNull: ['$reviewer.first_name', ''] },
                    ' ',
                    { $ifNull: ['$reviewer.last_name', ''] },
                  ],
                },
                '',
              ],
            },
            valuation: {
              valuation_id: '$initialvaluations._id',
              cash_to_customer: '$initialvaluations.cash_to_customer',
              available_liquidity_to_customer:
                '$initialvaluations.available_liquidity_to_customer',
              customer_cash_needs: '$initialvaluations.customer_cash_needs',
              tenure_in_months: '$initialvaluations.tenure_in_months',
              gold_weight: '$initialvaluations.gold_weight',
              gold_purity_entered_per_1000:
                '$initialvaluations.gold_purity_entered_per_1000',
              valuation_status: '$initialvaluations.valuation_status',
            },
          },
        },
        {
          $group: {
            _id: '$_id',
            customer_id: { $first: '$customer_id' },
            first_name: { $first: '$first_name' },
            last_name: { $first: '$last_name' },
            profile_image: { $first: '$profile_image' },
            email: { $first: '$email' },
            phone: { $first: '$phone' },
            liquidity_id: { $first: '$liquidity_id' },
            valuation_type: {
              $first: '$valuation_type',
            },
            booking_number: {
              $first: '$booking_number',
            },
            booking_date: { $first: '$booking_date' },
            start_time: { $first: '$start_time' },
            end_time: { $first: '$end_time' },
            kyc_status: {
              $first: '$kyc_status',
            },
            review_status: { $first: '$review_status' },
            review_by: { $first: '$review_by' },
            valuation: {
              $push: '$valuation',
            },
          },
        },
      ];
      appointments = await this.appointmentModel.aggregate(pipeline);
    }
    const isEmptyObject = (obj) => Object.keys(obj).length === 0;
    if (
      appointments[0].valuation &&
      appointments[0].valuation.length > 0 &&
      !appointments[0].valuation.every(isEmptyObject)
    ) {
      appointments[0].valuation = await Promise.all(
        appointments[0].valuation.map(async (valuation) => {
          valuation.cash_to_customer = await formatCurrency(
            valuation.cash_to_customer,
            i18,
          );
          valuation.available_liquidity_to_customer = await formatCurrency(
            valuation.available_liquidity_to_customer,
            i18,
          );
          valuation.customer_cash_needs = await formatCurrency(
            valuation.customer_cash_needs,
            i18,
          );
          return valuation;
        }),
      );
    } else {
      appointments[0].valuation = [];
      if (appointments[0]?.valuation_type !== 1) {
        const liquidity_details = await this.loanService.findLoan(
          appointments[0]?.liquidity_id,
          db_name,
        );
        appointments[0].liquidity = liquidity_details
          ? {
              liquidity_id: liquidity_details?._id,
              liquidatu_number: liquidity_details?.liquidate_number,
              cash_to_customer: await formatCurrency(
                liquidity_details?.cash_to_customer,
                i18,
              ),
              available_liquidity_to_customer: await formatCurrency(
                liquidity_details?.available_liquidity_to_customer,
                i18,
              ),
              customer_cash_needs: await formatCurrency(
                liquidity_details?.customer_cash_needs,
                i18,
              ),
              tenure_in_months: liquidity_details?.tenure_in_months,
              gold_weight: liquidity_details?.gold_weight,
              gold_purity_entered_per_1000:
                liquidity_details?.gold_purity_entered_per_1000,
            }
          : {};
      }
    }

    return { appointments };
  }

  async getDays(db_name, store_id, i18) {
    this.configModel = setTanantConnection(
      db_name,
      GlobalConfig.name,
      GlobalConfigSchema,
    );
    const days_count = await this.configModel.find({
      key: 'appointment_show_days',
    });
    const days = await getNextDays(days_count[0].value || 15);
    const holidays = await this.holidayService.getStoreHolidays(
      db_name,
      store_id,
      i18,
    );
    const findholidays = (date: Date, holidays: any) => {
      let number = true;
      if (holidays) {
        for (var i = 0; i < holidays.length; i++) {
          if (
            holidays[i].holiday_date.toISOString().split('T')[0] ==
            date.toISOString().split('T')[0]
          ) {
            number = false;
          }
        }
        return number;
      }
      return number;
    };

    const nextDates = days.map((nextDates) => {
      return {
        date: new Date(nextDates + ' GMT'),
        is_open: findholidays(new Date(nextDates + ' GMT'), holidays),
      };
    });
    return nextDates;
  }

  async getAllUpcomingEmi(
    store_id: string,
    db_name: string,
    body: GetLoanEmiDTO,
    i18n: I18nContext,
  ) {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);

    const pipeline: any[] = [
      {
        $match: {
          verification_office_id: new mongoose.Types.ObjectId(store_id),
        },
      },
      {
        $lookup: {
          from: 'loanemis',
          localField: '_id',
          foreignField: 'loan_id',
          as: 'loan_emi',
        },
      },
      {
        $unwind: '$loan_emi',
      },
      {
        $match: {
          $or: [
            { 'loan_emi.emi_status': 'pending' },
            { 'loan_emi.emi_status': 'overdue' },
          ],
        },
      },
      {
        $lookup: {
          from: 'customer',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $unwind: '$customer',
      },
      {
        $lookup: {
          from: 'loans',
          localField: 'loan_emi.loan_id',
          foreignField: '_id',
          as: 'loan',
        },
      },
      {
        $unwind: '$loan',
      },
      {
        $project: {
          _id: '$loan_emi.loan_id',
          liquidate_number: '$loan.liquidate_number',
          customer_id: '$customer._id',
          customer_first_name: '$customer.first_name',
          customer_last_name: '$customer.last_name',
          loan_emi_status: '$loan_emi.emi_status',
          customer_profile_image: { $ifNull: ['$profile_image', ''] },
          emi_amount: '$loan_emi.emi_amount',
          emi_number: '$loan_emi.emi_number',
          emi_payment_date: {
            $dateToString: {
              date: '$loan_emi.emi_payment_date',
            },
          },
        },
      },
      {
        $sort: {
          emi_payment_date: 1,
        },
      },
    ];
    if (body.payment_state == 4) {
      pipeline.splice(3, 0, {
        $match: {
          $or: [
            { 'loan_emi.emi_status': 'pending' },
            { 'loan_emi.emi_status': 'overdue' },
          ],
        },
      });
    } else {
      pipeline.splice(3, 0, {
        $match: {
          'loan_emi.emi_status': PAYMENT_STATE[body.payment_state],
        },
      });
    }
    const filterDate = body.date ? new Date(body.date) : null;
    if (filterDate) {
      pipeline.splice(3, 0, {
        $match: {
          $expr: {
            $eq: [
              {
                $dateTrunc: { date: '$loan_emi.emi_payment_date', unit: 'day' },
              },
              { $dateTrunc: { date: filterDate, unit: 'day' } },
            ],
          },
        },
      });
    }

    let allUpcomingEmi = await this.loanModel.aggregate(pipeline);

    allUpcomingEmi = await Promise.all(
      allUpcomingEmi.map(async (emi) => {
        emi.emi_amount = await formatCurrency(emi.emi_amount, i18n);
        return emi;
      }),
    );

    return allUpcomingEmi;
  }

  async getLoanData(db_name: string, body: GetLoanDTO, i18n: I18nContext) {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    const LoanData = await this.loanModel.aggregate([
      {
        $match: {
          _id: new ObjectId(body.loan_id),
        },
      },
      {
        $lookup: {
          from: 'loanemis',
          localField: '_id',
          foreignField: 'loan_id',
          as: 'liquidity_installment',
        },
      },
      {
        $lookup: {
          from: 'customer',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
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
        $project: {
          liquidity: {
            _id: 1,
            liquidate_number: '$liquidate_number',
            gold_rate_at_valuation: '$gold_rate_at_valuation',
            tenure_in_months: '$tenure_in_months',
            total_margin: '$margin',
            margin_rate: '$margin_rate',
            gold_weight: '$gold_weight',
            gold_purity_entered_per_1000: '$gold_purity_entered_per_1000',
            installment_value: {
              $ifNull: [
                { $arrayElemAt: ['$first_installment.emi_amount', 0] },
                0,
              ],
            },
          },
          liquidity_installment: {
            _id: 1,
            emi_amount: 1,
            emi_number: 1,
            emi_status: 1,
            emi_payment_date: 1,
            penalty: '',
          },
          customer: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            email: 1,
            country_code: 1,
            phone: 1,
          },
        },
      },
    ]);

    if (LoanData.length > 0) {
      // Format EMI amounts
      await Promise.all(
        LoanData[0].liquidity_installment.map(async (emi) => {
          emi.emi_amount = await formatCurrency(emi.emi_amount, i18n);
          return emi;
        }),
      );

      // Format loan fields
      LoanData[0].liquidity.installment_value = await formatCurrency(
        LoanData[0].liquidity.installment_value,
        i18n,
      );
      LoanData[0].liquidity.total_margin = await formatCurrency(
        LoanData[0].liquidity.total_margin,
        i18n,
      );
      LoanData[0].liquidity.gold_rate_at_valuation = await formatCurrency(
        LoanData[0].liquidity.gold_rate_at_valuation,
        i18n,
      );

      LoanData[0].liquidity.tenure_in_months = `${LoanData[0].liquidity.tenure_in_months} ${i18n.t('lang.gold_loan.months')}`;
    }

    return LoanData.length > 0 ? LoanData[0] : null;
  }
}

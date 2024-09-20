import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import {
  BookedUserAppointment,
  UpdateAppointmentStatus,
  UserAppointmentDTO,
} from '../dto/user_appointment.dto';
import {
  LoanAppointMentBooking,
  LoanAppointMentBookingSchema,
} from '../schema/user_appointment.schema';
import { StoreAvailabilityService } from './store_availability.service';
import {
  comman_slot_date,
  date_moment,
  format_date,
  formatTimeIn12HourFormat,
  getNextDays,
  sub_days,
  TIMEZONE_UTC,
} from 'src/utils/date.util';
import { StoreService } from '../../store/store.service';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400 } from 'src/utils/http-code.util';
import { CustomerService } from 'src/customer/service/customer.service';
import { GoldLoanService } from 'src/app/gold_loan/gold_loan.service';
import { I18nContext } from 'nestjs-i18n';
import { UpdateAppointmentDTO } from '../dto/update_appointment.dto';
import { LoanService } from '../../loan/service/loan.service';
import { ApplicationStatusService } from './application_status.service';
import { NotificationTemplateService } from 'src/app/notification_template/notification_template.service';
import { CustomerNotificationService } from 'src/app/notification/notification.service';
import { AuthService } from 'src/app/auth/auth.service';
import { EmailTemplateService } from 'src/app/email_template/email_template.service';
import { notify } from 'src/app/events/class/notification.class';
import { ConvertTimeStringToMinutes } from 'src/utils/formate.util';
import { AppointmentType } from 'src/utils/enums.util';

@Injectable()
export class AppointmentService {
  public loanAppointMentBookingModel: Model<any>;

  constructor(
    private readonly storeAvailabilityService: StoreAvailabilityService,
    @Inject(forwardRef(() => StoreService))
    private readonly storeService: StoreService,
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => GoldLoanService))
    private readonly goldLaonService: GoldLoanService,
    @Inject(forwardRef(() => LoanService))
    private readonly laonService: LoanService,
    @Inject(forwardRef(() => ApplicationStatusService))
    private readonly applicationStatusService: ApplicationStatusService,
    @Inject(forwardRef(() => NotificationTemplateService))
    private readonly notificationTemplateService: NotificationTemplateService,
    @Inject(forwardRef(() => CustomerNotificationService))
    private readonly customerNotificationService: CustomerNotificationService,
    // @Inject(forwardRef(() => StaffNotificationsService))
    // private readonly staffNotificationsService: StaffNotificationsService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => EmailTemplateService))
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  async getAppointmentById(id: string, db_name: string): Promise<any> {
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );

    let user;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await this.loanAppointMentBookingModel
        .findById({ _id: id })
        .exec();
    }
    return user ? user : false;
  }

  async getAppointmentByStoreId(id: string, db_name: string): Promise<any> {
    let user;
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await this.loanAppointMentBookingModel
        .findOne({ store_id: id })
        .exec();
    }
    return user ? user : false;
  }

  async getAppointmentByValuationId(id: string, db_name: string): Promise<any> {
    let user;
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await this.loanAppointMentBookingModel
        .findOne({ valuation_id: id })
        .exec();
    }
    return user ? user : false;
  }
  async findExistingAppointment(
    userAppointmentDTO: UserAppointmentDTO,
    db_name: string,
  ): Promise<LoanAppointMentBooking[]> {
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );
    const existingAppointment = await this.loanAppointMentBookingModel
      .find({
        store_id: userAppointmentDTO.store_id,
        $or: [
          {
            $and: [
              {
                valuation_id: {
                  $in: userAppointmentDTO.valuation_id.map(
                    (id) => new mongoose.Types.ObjectId(id),
                  ),
                },
              },
              { booking_date: { $gt: date_moment() } },
            ],
          },
          {
            $and: [
              {
                loan_id: new mongoose.Types.ObjectId(
                  userAppointmentDTO?.loan_id,
                ),
              },
              { booking_date: { $gt: date_moment() } },
              { appointment_type: userAppointmentDTO.appointment_type },
            ],
          },
        ],
      })
      .exec();
    return existingAppointment;
  }

  async bookUserAppointMent(
    userAppointmentDTO: UserAppointmentDTO,
    user_id: string,
    db_name: string,
    staff_id: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );
    const existingAppointment = await this.findExistingAppointment(
      userAppointmentDTO,
      db_name,
    );
    if (existingAppointment.length > 0) {
      throw new BadRequestException(i18n.t(`lang.appointment.already_booked`));
    } else {
      const store = await this.storeService.getStoreById(
        userAppointmentDTO.store_id,
        db_name,
      );
      if (!store) {
        throw new BadRequestException(
          i18n.t(`lang.appointment.store_not_found`),
        );
      }
      const appointmentAvailability =
        await this.storeAvailabilityService.getBranchAvailability(
          userAppointmentDTO.time_slot_id,
          db_name,
        );
      if (!appointmentAvailability) {
        throw new BadRequestException(i18n.t(`lang.appointment.not_found`));
      }
      const appointments =
        await this.getUserAppointMents(
          {
            store_id: userAppointmentDTO.store_id,
            time_slot_id: userAppointmentDTO.time_slot_id,
            booking_date: userAppointmentDTO.booking_date,
          },
          db_name,
        );
        
      const availableSlots = appointmentAvailability.max_attendee - appointments.length;
      
      if (availableSlots <= 0) {
        throw new BadRequestException(i18n.t('lang.appointment.no_slots_available'));
      }

      let appointmentNumber: string;
      let existingAppointmentNumber: string;

      do {
        appointmentNumber = `AP${new Date().getTime()}`;
        existingAppointmentNumber = await this.loanAppointMentBookingModel
          .findOne({
            booking_number: appointmentNumber,
          })
          .exec();
      } while (existingAppointmentNumber);
      userAppointmentDTO.booking_number = appointmentNumber;

      userAppointmentDTO.customer_id = user_id;
      userAppointmentDTO.booking_date = userAppointmentDTO.booking_date;
      userAppointmentDTO.is_branch_visited = false;
      const newAppointment = new this.loanAppointMentBookingModel({
        ...userAppointmentDTO,
        appointment_start_time: appointmentAvailability?.start_time,
        appointment_end_time: appointmentAvailability?.end_time,
      });
      await newAppointment.save();

      const appointment_time =
        await this.storeAvailabilityService.getBranchAvailability(
          userAppointmentDTO.time_slot_id,
          db_name,
        );

      await Promise.all(
        userAppointmentDTO.valuation_id.map((valuationId) =>
          this.applicationStatusService.updateApplicationStatus(
            {
              loan_id: null,
              valuation_id: valuationId,
              application_status: 1,
              status_update_date: date_moment(),
              reason_for_rejection: null,
            },
            db_name,
            i18n,
          ),
        ),
      );

      await Promise.all(
        userAppointmentDTO.valuation_id.map((valuationId) =>
          this.goldLaonService.updateValuationStatus(
            valuationId,
            1,
            db_name,
            userAppointmentDTO?.store_id,
          ),
        ),
      );

      const customer = await this.customerService.getUserProfile(
        newAppointment.customer_id.toString(),
        db_name,
      );

      // manage if customer_id customer side then book appointment (when staff login)
      const staff = await this.authService.getUserProfile(staff_id, db_name);

      if (staff) {
        const formattedDate = format_date(
          'DD MMMM YYYY',
          newAppointment?.booking_date,
        );
        const appointmentTypeName = await this.getAppointmentTypeName(
          newAppointment?.appointment_type,
        );
        const placeholders = {
          id: newAppointment?.booking_number,
          date: formattedDate,
          time:
            appointment_time?.start_time + ' TO ' + appointment_time?.end_time,
          customer_name: customer?.first_name + ' ' + customer?.last_name,
          appointment_type: appointmentTypeName,
        };
        await this.customerNotificationService.sendPushNotification(
          newAppointment?.customer_id.toString(),
          'customer_side_book_appointment',
          'notification',
          3,
          db_name,
          placeholders,
        );
      }

      // manage if customer side then book usig user_id (when customer login)
      if (!staff) {
        await this.customerNotificationService.sendPushNotification(
          newAppointment?.customer_id.toString(),
          'book_appointment',
          'notification',
          3,
          db_name,
        );
        //TODO:= SEND NOTIFICATIONS TO ALL STORE STAFF
        // await this.staffNotificationsService.sendPushNotification(
        //   newAppointment?.customer_id,
        //   'staff_side_book_appointment',
        //   'notification',
        //   3,
        //   db_name,
        //   null,
        //   newAppointment.store_id.toString(),
        // );
        if (customer?.email) {
          const formattedDate = format_date(
            'DD MMMM YYYY',
            newAppointment?.booking_date,
          );
          const store_owner_details = await this.authService.getUserProfile(
            store?.branch_owner_id.toString(),
            db_name,
          );
          const data = {
            store_name: store?.name,
            customer_name: `${customer?.first_name} ${customer?.last_name}`,
            date: formattedDate,
            time:
              appointment_time?.start_time +
              ' TO ' +
              appointment_time?.end_time,
            address: store?.address,
            contact_information: `${store_owner_details?.country_code}${store_owner_details?.mobile_number}`,
          };
          await this.emailTemplateService.sendEmail(
            customer?.email,
            'appointment_booking',
            db_name,
            data,
          );
        }
      }
      notify.notifyClients(
        userAppointmentDTO.store_id,
        'appointment is booked',
        'appointment is booked',
        newAppointment,
      );
      return {
        appointment_id: newAppointment?.id,
        booking_number: newAppointment?.booking_number,
        customer_id: newAppointment.customer_id,
        full_name: `${customer?.first_name} ${customer?.last_name}`,
        email: customer?.email || '',
        phone: `${customer?.country_code} ${customer.phone}`,
        store_id: newAppointment.store_id,
        appointment_type: newAppointment?.appointment_type,
        store_name: store?.name,
        store_address: store?.address,
        store_location: store?.location,
        time_slot_id: userAppointmentDTO.time_slot_id,
        valuation_id: newAppointment?.valuation_id,
        booking_date: newAppointment?.booking_date,
        day: appointment_time?.day,
        appointment_start_time: appointment_time?.start_time,
        appointment_end_time: appointment_time?.end_time,
      };
    }
  }

  async getAppointmentTypeName(
    appointmentType: AppointmentType,
  ): Promise<string> {
    switch (appointmentType) {
      case AppointmentType.Valuation_appointment:
        return 'Valuation';
      case AppointmentType.Buyback_appointment:
        return 'Buyback';
      case AppointmentType.Extends_appointment:
        return 'Extends';
      case AppointmentType.Liquidate_appointment:
        return 'Liquidate';
      default:
        return 'Unknown Appointment Type';
    }
  }

  async updateTimeslots(
    time_slot_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );
    const appointmentAvailability =
      await this.storeAvailabilityService.getBranchAvailability(
        time_slot_id,
        db_name,
      );
    const bookedAppointment = await this.loanAppointMentBookingModel
      .find({ time_slot_id: time_slot_id })
      .exec();
    if (bookedAppointment.length === appointmentAvailability.max_attendee) {
      await this.storeAvailabilityService.updateBranchAvailability(
        time_slot_id,
        db_name,
        i18n,
      );
    }
  }

  async getUserAllAppointMents(
    id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );
    const bookedAppointment = await this.loanAppointMentBookingModel
      .find({
        $or: [
          { customer_id: id },
          { store_id: id },
          { valuation_id: new mongoose.Types.ObjectId(id) },
        ],
      })
      .sort({ booking_date: -1 })
      .exec();
    if (!bookedAppointment) {
      throw new BadRequestException(
        i18n.t(`lang.appointment.appointment_not_found`),
      );
    }
    const appointments = await Promise.all(
      bookedAppointment.map(async (appointment) => {
        const store = await this.storeService.getStoreById(
          (appointment?.store_id).toString(),
          db_name,
        );

        const appointment_time =
          await this.storeAvailabilityService.getBranchAvailability(
            appointment.time_slot_id.toString(),
            db_name,
          );
        const startTimeMinutes = await ConvertTimeStringToMinutes(
          appointment_time?.start_time || 0,
        );
        return {
          appointment_id: appointment?.id,
          booking_number: appointment?.booking_number,
          customer_id: appointment.customer_id,
          loan_id: appointment?.loan_id || ' ',
          store_id: appointment.store_id,
          store_name: store?.name,
          store_address: store?.address,
          store_location: store?.location || '',
          time_slot_id: appointment.time_slot_id,
          valuation_id: appointment?.valuation_id,
          booking_date: appointment?.booking_date,
          day: appointment_time?.day,
          appointment_start_time: appointment_time?.start_time,
          appointment_end_time: appointment_time?.end_time,
          is_branch_visited: appointment?.is_branch_visited,
          startTimeMinutes: startTimeMinutes,
        };
      }),
    );
    const sortedAppointments = appointments.sort((a, b) => {
      if (a.booking_date < b.booking_date) return 1;
      if (a.booking_date > b.booking_date) return -1;

      if (a.startTimeMinutes < b.startTimeMinutes) return -1;
      if (a.startTimeMinutes > b.startTimeMinutes) return 1;

      return 0;
    });

    return sortedAppointments;
  }

  async getBookedUserAppointMent(
    bookedUserAppointment: BookedUserAppointment,
    db_name: string,
  ): Promise<any> {
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );
    const bookedAppointment = await this.loanAppointMentBookingModel
      .findOne({
        $and: [
          { store_id: bookedUserAppointment.store_id },
          { time_slot_id: bookedUserAppointment.time_slot_id },
          { booking_date: { $gte: date_moment() } },
        ],
      })
      .exec();
    if (!bookedAppointment) {
      return false;
    }
    return bookedAppointment;
  }

  async getUserAppointMents(
    bookedUserAppointment: BookedUserAppointment,
    db_name: string,
  ): Promise<any> {
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );
    const bookedAppointment = await this.loanAppointMentBookingModel
      .find({
        $and: [
          { store_id: bookedUserAppointment.store_id },
          { time_slot_id: bookedUserAppointment.time_slot_id },
          { booking_date: bookedUserAppointment?.booking_date },
        ],
      })
      .exec();
    if (!bookedAppointment) {
      return false;
    }
    return bookedAppointment;
  }

  async updateAppointmentStatus(
    db_name: string,
    updateAppointmentStatus: UpdateAppointmentStatus,
  ): Promise<any> {
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );

    const updatedAppointmentStatus =
      await this.loanAppointMentBookingModel.findOneAndUpdate(
        { valuation_id: updateAppointmentStatus.valuation_id },
        {
          $set: {
            is_branch_visited: updateAppointmentStatus?.is_branch_visited,
          },
        },
        { new: true },
      );

    return updatedAppointmentStatus;
  }

  async getAllAppointMents(db_name: string, store_id?: string): Promise<any> {
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );

    const bookedAppointment = await this.loanAppointMentBookingModel.aggregate([
      {
        $match: {
          ...(store_id
            ? { store_id: new mongoose.Types.ObjectId(store_id) }
            : {}),
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
          from: 'branchtimeavailabilities',
          localField: 'time_slot_id',
          foreignField: '_id',
          as: 'branch_time',
        },
      },
      {
        $unwind: '$branch_time',
      },
      {
        $lookup: {
          from: 'branches',
          localField: 'store_id',
          foreignField: '_id',
          as: 'store',
        },
      },
      {
        $unwind: '$store',
      },
      {
        $project: {
          _id: 0,
          appointment_id: '$_id',
          appointment_type: 1,
          booking_number: '$booking_number',
          time_slot_id: 1,
          valuation_id: 1,
          store_id: 1,
          store_name: '$store.name',
          store_address: '$store.address',
          is_branch_visited: 1,
          customer_id: '$customer._id',
          booking_date: 1,
          liquidity_id: { $ifNull: ['$loan_id', ''] },
          day: { $ifNull: ['$branch_time.day', ''] },
          appointment_start_time: { $ifNull: ['$appointment_start_time', ''] },
          appointment_end_time: { $ifNull: ['$appointment_end_time', ''] },
          customer: {
            id: '$customer._id',
            full_name: {
              $concat: ['$customer.first_name', ' ', '$customer.last_name'],
            },
            email: { $ifNull: ['$customer.email', ''] },
            phone: {
              $concat: ['$customer.country_code', ' ', '$customer.phone'],
            },
            profile_image: { $ifNull: ['$customer.profile_image', ''] },
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
          is_completed: {
            $cond: [
              {
                $or: [
                  {
                    $lt: [
                      '$booking_date',
                      sub_days(date_moment(), 1, TIMEZONE_UTC),
                    ],
                  },
                  { $eq: ['$is_branch_visited', true] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
      {
        $sort: {
          is_completed: 1,
          is_branch_visited: 1,
          booking_date: 1,
          start_time_minutes: 1,
        },
      },
    ]);

    if (!bookedAppointment) {
      return [];
    }
    return bookedAppointment;
  }

  async getAppointMentValuations(
    appointment_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    const loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );

    const bookedAppointment = await loanAppointMentBookingModel
      .findOne({ _id: appointment_id })
      .exec();

    if (!bookedAppointment) {
      throw new BadRequestException(
        i18n.t(`lang.appointment.appointment_not_found`),
      );
    }

    const customer = await this.customerService.getUserProfile(
      bookedAppointment.customer_id.toString(),
      db_name,
    );

    const getValuationDetails = async (valuation: string) => {
      const initialValuationDetails =
        await this.goldLaonService.getCustomerLoanEstimation(
          valuation.toString(),
          bookedAppointment.customer_id.toString(),
          db_name,
        );
      const total_margin = await this.goldLaonService.calculateMargin(
        initialValuationDetails?.cash_to_customer,
        initialValuationDetails?.margin_rate,
        initialValuationDetails?.tenure_in_months,
      );
      const installment =
        total_margin / initialValuationDetails.tenure_in_months;
      return {
        valuation_id: valuation,
        current_status: initialValuationDetails?.valuation_status,
        valuation_status:
          await this.applicationStatusService.getAllApplicationStatus(
            valuation,
            db_name,
            i18n,
          ),
        margin_rate: initialValuationDetails?.margin_rate,
        total_margin: await this.goldLaonService.formatCurrency(
          total_margin,
          i18n,
        ),
        installment: await this.goldLaonService.formatCurrency(
          installment,
          i18n,
        ),
        customer_id: customer?.id,
        valuation_number: initialValuationDetails?.valuation_number,
        cash_to_customer: await this.goldLaonService.formatCurrency(
          initialValuationDetails.cash_to_customer,
          i18n,
        ),
        available_liquidity_to_customer:
          await this.goldLaonService.formatCurrency(
            initialValuationDetails?.available_liquidity_to_customer || 0,
            i18n,
          ),
        customer_cash_needs: await this.goldLaonService.formatCurrency(
          initialValuationDetails.customer_cash_needs,
          i18n,
        ),
        tenure: `${initialValuationDetails.tenure_in_months} ${i18n.t('lang.gold_loan.months')}`,
        gold_weight: initialValuationDetails?.gold_weight,
        gold_purity_entered_per_1000:
          initialValuationDetails?.gold_purity_entered_per_1000,
      };
    };

    const valuation_list = await Promise.all(
      bookedAppointment.valuation_id.length > 0
        ? bookedAppointment.valuation_id.map(getValuationDetails)
        : bookedAppointment?.loan_id
          ? [
              getValuationDetails(
                (
                  await this.laonService.findLoan(
                    bookedAppointment.loan_id,
                    db_name,
                  )
                ).valuation_id,
              ),
            ]
          : [],
    );
    const is_completed =
      sub_days(date_moment(), 1, TIMEZONE_UTC) >
        bookedAppointment?.booking_date ||
      bookedAppointment?.is_branch_visited == true
        ? 1
        : 0;
    return {
      appointment_id: bookedAppointment.id,
      is_brach_visited: bookedAppointment?.is_branch_visited,
      booking_date: bookedAppointment?.booking_date,
      is_completed: is_completed,
      valuation_list,
      customer: {
        id: customer?.id,
        full_name: `${customer?.first_name} ${customer?.last_name}`,
        email: customer?.email || '',
        phone: `${customer?.country_code} ${customer.phone}`,
        profile_image: customer?.profile_image || '',
      },
    };
  }

  async updateAppointment(
    updateAppointmentDTO: UpdateAppointmentDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    const { appointment_id, valuation_id } = updateAppointmentDTO;
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );

    const existingAppointment = await this.loanAppointMentBookingModel
      .find({
        valuation_id: { $in: valuation_id },
      })
      .exec();
    if (existingAppointment.length > 0) {
      throw new BadRequestException(i18n.t(`lang.appointment.already_booked`));
    } else {
      await this.loanAppointMentBookingModel.updateOne(
        { _id: appointment_id },
        { $push: { valuation_id: valuation_id } },
      );
    }
  }

  async findAppointmentsAfterTwoDays(db_name: string): Promise<any> {
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );

    const nextDays = await getNextDays(3);
    const appointmentsAfterTwoDays = await this.loanAppointMentBookingModel
      .find({
        booking_date: { $eq: comman_slot_date(nextDays[2], TIMEZONE_UTC) },
      })
      .exec();

    appointmentsAfterTwoDays.map(async (appointment) => {
      const customerId = appointment.customer_id.toString();
      await this.customerNotificationService.sendPushNotification(
        customerId,
        'appointment_reminder_before_two_days',
        'notification',
        3,
        db_name,
        { booking_number: appointment?.booking_number },
      );
    });
  }

  async getTodayAppointments(db_name: string): Promise<any> {
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );
    const booking_date = await getNextDays(1);
    const appointments_data = await this.loanAppointMentBookingModel
      .find({ booking_date: comman_slot_date(booking_date, TIMEZONE_UTC) })
      .exec();

    appointments_data.map(async (appointment) => {
      const customerId = appointment.customer_id.toString();
      await this.customerNotificationService.sendPushNotification(
        customerId,
        'appointment_reminder_same_day_morning',
        'notification',
        3,
        db_name,
        { booking_number: appointment?.booking_number },
      );
    });
  }

  async get2hoursAgoAppointments(db_name: string): Promise<any> {
    this.loanAppointMentBookingModel = setTanantConnection(
      db_name,
      LoanAppointMentBooking.name,
      LoanAppointMentBookingSchema,
    );

    const currentTime = new Date();
    const twoHoursFromNow = new Date(
      currentTime.getTime() + 2 * 60 * 60 * 1000,
    );
    const twoHoursPlusFiveMinutesFromNow = new Date(
      twoHoursFromNow.getTime() + 5 * 60 * 1000,
    );

    const [start_time_minutes, end_time_minutes] = await Promise.all([
      ConvertTimeStringToMinutes(
        await formatTimeIn12HourFormat(twoHoursFromNow),
      ),
      ConvertTimeStringToMinutes(
        await formatTimeIn12HourFormat(twoHoursPlusFiveMinutesFromNow),
      ),
    ]);

    const booking_date = await getNextDays(1);
    const appointments_data = await this.loanAppointMentBookingModel
      .find({
        booking_date: comman_slot_date(booking_date, TIMEZONE_UTC),
      })
      .exec();
    const appointmentWithinTwoHours = await Promise.all(
      appointments_data.map(async (ap) => {
        const startTimeMinutes = await ConvertTimeStringToMinutes(
          ap?.['appointment_start_time'],
        );
        const case1 =
          start_time_minutes <= startTimeMinutes &&
          end_time_minutes >= startTimeMinutes;
        if (case1 == true) {
          return ap;
        } else {
          return undefined;
        }
      }),
    );

    const filteredAppointments = appointmentWithinTwoHours.filter(
      (ap) => ap !== undefined,
    );

    filteredAppointments.map(async (appointment) => {
      const customerId = appointment.customer_id.toString();
      await this.customerNotificationService.sendPushNotification(
        customerId,
        'appointment_reminder_before_two_hours',
        'notification',
        3,
        db_name,
        { booking_number: appointment?.booking_number },
      );
    });
  }
}

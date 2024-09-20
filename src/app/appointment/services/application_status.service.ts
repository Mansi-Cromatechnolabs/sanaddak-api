import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import {
  LoanApplicationStatus,
  LoanStatusSchema,
} from '../schema/loan_application_status.schema';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { ApplicationStatusDTO } from '../dto/loan_application_status.dto';
import { date_moment } from 'src/utils/date.util';
import { GoldLoanService } from 'src/app/gold_loan/gold_loan.service';
import { LoanService } from '../../loan/service/loan.service';
import { StaffNotificationsService } from 'src/app/staff_notifications/staff_notifications.service';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';
import { AppointmentService } from './appointment.service';
import { CustomerService } from 'src/customer/service/customer.service';
import {
  InitialValuations,
  InitialValuationSchema,
} from 'src/app/gold_loan/schema/customer_loan_estimation.schema';
import { CustomerNotificationService } from 'src/app/notification/notification.service';
import { StoreService } from 'src/app/store/store.service';
import { ApplicationStatus } from 'src/utils/enums.util';
import { Customer, CustomerSchema } from 'src/customer/schema/customer.schema';

@Injectable()
export class ApplicationStatusService {
  public loanApplicationStatusModel: Model<any>;
  public initialValuationModel: Model<any>;
  public customerModel: Model<Customer>;
  constructor(
    @Inject(forwardRef(() => GoldLoanService))
    private readonly goldLoanService: GoldLoanService,
    @Inject(forwardRef(() => LoanService))
    private readonly loanService: LoanService,
    @Inject(forwardRef(() => StaffNotificationsService))
    private readonly staffNotificationsService: StaffNotificationsService,
    @Inject(forwardRef(() => AppointmentService))
    private readonly appointmentService: AppointmentService,
    @Inject(forwardRef(() => CustomerNotificationService))
    private readonly customerNotificationService: CustomerNotificationService,
    @Inject(forwardRef(() => StoreService))
    private readonly storeService: StoreService,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
  ) {}

  async addApplicationStatus(
    applicationStatusDTO: ApplicationStatusDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<LoanApplicationStatus> {
    this.loanApplicationStatusModel = setTanantConnection(
      db_name,
      LoanApplicationStatus.name,
      LoanStatusSchema,
    );

    try {
      let loan;
      if (applicationStatusDTO?.loan_id) {
        loan = await this.loanService.findLoan(
          applicationStatusDTO?.loan_id,
          db_name,
        );
      }
      applicationStatusDTO.valuation_id = loan
        ? (loan?.valuation_id).toString()
        : applicationStatusDTO.valuation_id;
      const existingStatus = await this.findExistingStatus(
        applicationStatusDTO,
        db_name,
      );

      if (existingStatus) {
        existingStatus.reason_for_rejection =
          applicationStatusDTO.reason_for_rejection;
        existingStatus.status_update_date = date_moment();
        await existingStatus.save();
        return existingStatus;
      }

      const customer_approvred = await this.loanApplicationStatusModel.findOne({
        valuation_id: applicationStatusDTO?.valuation_id,
      });
      if (customer_approvred?.application_status === 6) {
        throw new BadRequestException(
          i18n.t(`lang.appointment.application_status_accept_customer`),
        );
      }

      applicationStatusDTO.status_update_date = date_moment();
      const applicationStatus = new this.loanApplicationStatusModel({
        ...applicationStatusDTO,
      });

      await applicationStatus.save();
      if (loan) {
        await this.updateCustomerAgreementStatus(
          applicationStatus,
          loan?.created_by,
          loan?.customer_id,
          (loan?.id).toString(),
          db_name,
        );
      }
      return applicationStatus;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      } else {
        throw new Error(i18n.t(`lang.appointment.application_status_fail`));
      }
    }
  }

  async findExistingStatus(
    applicationStatusDTO: ApplicationStatusDTO,
    db_name: string,
  ): Promise<LoanApplicationStatus> {
    this.loanApplicationStatusModel = setTanantConnection(
      db_name,
      LoanApplicationStatus.name,
      LoanStatusSchema,
    );
    const existingStatus = await this.loanApplicationStatusModel.findOne({
      valuation_id: applicationStatusDTO.valuation_id,
      application_status: applicationStatusDTO.application_status,
      status_delete_date: null,
    });
    return existingStatus;
  }

  async updateApplicationStatus(
    applicationStatusDTO: ApplicationStatusDTO,
    db_name: string,
    i18n: I18nContext,
    store_id?: string,
  ): Promise<LoanApplicationStatus | any> {
    this.loanApplicationStatusModel = setTanantConnection(
      db_name,
      LoanApplicationStatus.name,
      LoanStatusSchema,
    );

    try {
      if (applicationStatusDTO?.valuation_id) {
        await this.updateStoreVisitStatus(
          db_name,
          applicationStatusDTO.valuation_id,
        );
        if (applicationStatusDTO.application_status === 2) {
          const updatedAppointmentStatus =
            await this.appointmentService.updateAppointmentStatus(db_name, {
              valuation_id: applicationStatusDTO?.valuation_id,
              is_branch_visited: true,
            });

          if (updatedAppointmentStatus.is_branch_visited === true) {
            const branch_details = await this.storeService.getStoreDetails(
              updatedAppointmentStatus.store_id,
              db_name,
            );
            const customer_details = await this.customerService.getUserProfile(
              updatedAppointmentStatus.customer_id.toString(),
              db_name,
            );

            const placeholders = {
              store_name: branch_details?.name,
            };
            await this.customerNotificationService.sendPushNotification(
              customer_details._id.toString(),
              'user_visit_at_store',
              'notification',
              1,
              db_name,
              placeholders,
            );
          }
        }

        if (applicationStatusDTO.application_status === 4) {
          const appointments =
            await this.appointmentService.getAppointmentByValuationId(
              applicationStatusDTO?.valuation_id,
              db_name,
            );
          if (appointments) {
            await this.customerNotificationService.sendPushNotification(
              appointments?.customer_id.toString(),
              'gold_pieces_and_send_contract',
              'notification',
              1,
              db_name,
            );
          }
        }
      }

      return await this.addApplicationStatus(
        applicationStatusDTO,
        db_name,
        i18n,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      } else {
        throw new Error(i18n.t(`lang.appointment.application_status_fail`));
      }
    } finally {
      if (applicationStatusDTO.application_status === 4) {
        await this.goldLoanService.updateValuationStatus(
          applicationStatusDTO.valuation_id,
          applicationStatusDTO.application_status,
          db_name,
          store_id,
        );
        const customerVerified = await this.updateValuationCheck(
          applicationStatusDTO.valuation_id,
          db_name,
          i18n,
        );
        if (
          customerVerified.message === i18n.t('lang.kyc.user_not_verified') ||
          customerVerified.message === i18n.t('lang.kyc.user_kyc_not_approved')
        ) {
          return customerVerified;
        }
      } else {
        await this.goldLoanService.updateValuationStatus(
          applicationStatusDTO.valuation_id,
          applicationStatusDTO.application_status,
          db_name,
        );
      }
    }
  }

  async updateValuationCheck(
    valuation_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.initialValuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );

    const valuation = await this.initialValuationModel
      .findOne({ _id: new mongoose.Types.ObjectId(valuation_id) })
      .exec();

    const customer = await this.customerModel
      .aggregate([
        {
          $match: {
            _id: valuation?.customer_id,
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: 'userkycdetails',
            localField: '_id',
            foreignField: 'customer_id',
            as: 'kyc_details',
          },
        },
        {
          $unwind: {
            path: '$kyc_details',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            email: 1,
            country_code: 1,
            phone: 1,
            is_active: 1,
            is_kyc_verified: 1,
            is_email_verified: 1,
            is_mobile_number_verified: 1,
            kyc_status: {
              $ifNull: ['$kyc_details.kyc_status', ''],
            },
            review_status: {
              $ifNull: ['$kyc_details.review_status', ''],
            },
          },
        },
      ])
      .limit(1)
      .then((result) => result[0]);

    if (customer?.kyc_status == '') {
      return {
        message: i18n.t('lang.kyc.user_not_verified'),
      };
    } else if (
      customer?.kyc_status == 'Verified' &&
      customer?.review_status == ''
    ) {
      return {
        message: i18n.t('lang.kyc.user_kyc_not_approved'),
      };
    } else {
      return true;
    }
  }

  async updateStoreVisitStatus(
    db_name: string,
    valuation_id: string,
  ): Promise<void> {
    this.loanApplicationStatusModel = setTanantConnection(
      db_name,
      LoanApplicationStatus.name,
      LoanStatusSchema,
    );

    const statusOneExists = await this.loanApplicationStatusModel.findOne({
      valuation_id: valuation_id,
      application_status: ApplicationStatus.APPLIED_FOR_LOAN,
    });

    if (statusOneExists) {
      const statusTwoExists = await this.loanApplicationStatusModel.findOne({
        valuation_id: valuation_id,
        application_status: ApplicationStatus.STORE_VISIT,
      });

      if (!statusTwoExists) {
        const statusTwoEntry = new this.loanApplicationStatusModel({
          valuation_id,
          application_status: ApplicationStatus.STORE_VISIT,
          status_update_date: date_moment(),
          reason_for_rejection: null,
        });
        await statusTwoEntry.save();
      }
      await this.appointmentService.updateAppointmentStatus(db_name, {
        valuation_id,
        is_branch_visited: true,
      });
    }
  }

  async updateCustomerAgreementStatus(
    applicationStatus: LoanApplicationStatus,
    user_id: string,
    customer_id: string,
    loan_id: string,
    db_name: string,
  ): Promise<any> {
    this.loanApplicationStatusModel = setTanantConnection(
      db_name,
      LoanApplicationStatus.name,
      LoanStatusSchema,
    );
    if (applicationStatus.application_status === 6) {
      const customer = await this.customerService.getUserProfile(
        customer_id.toString(),
        db_name,
      );
      const loan = await this.loanService.findLoan(loan_id, db_name);
      const data = {
        customer_name: `${customer?.first_name} ${customer?.last_name}`,
        liquidity_number: loan?.liquidate_number,
      };

      await this.staffNotificationsService.sendPushNotification(
        customer_id.toString(),
        'staff_agreement_approved_by_customer',
        'notification',
        1,
        db_name,
        user_id,
        null,
        data,
        { loan_id: loan_id, screen: 'Dashboard' },
      );
      await this.customerNotificationService.sendPushNotification(
        customer_id.toString(),
        'customer_agreement_approved_by_customer',
        'notification',
        3,
        db_name,
      );
    } else if (applicationStatus.application_status === 7) {
      await this.staffNotificationsService.sendPushNotification(
        customer_id,
        'agreement_rejected_by_customer',
        'notification',
        1,
        db_name,
        user_id,
        null,
        { loan_id: loan_id, screen: 'Dashboard' },
      );
    }
  }

  async getLoanApplicationStatus(
    loan_id: string,
    db_name: string,
  ): Promise<LoanApplicationStatus> {
    this.loanApplicationStatusModel = setTanantConnection(
      db_name,
      LoanApplicationStatus.name,
      LoanStatusSchema,
    );
    const loan = await this.loanService.findLoan(loan_id, db_name);
    const existingStatus = await this.loanApplicationStatusModel
      .findOne({ valuation_id: loan?.valuation_id, status_delete_date: null })
      .sort({ application_status: -1 })
      .limit(1);
    return existingStatus;
  }

  async getAllApplicationStatus(
    valuation_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any[]> {
    this.loanApplicationStatusModel = setTanantConnection(
      db_name,
      LoanApplicationStatus.name,
      LoanStatusSchema,
    );
    const existingStatus = await this.loanApplicationStatusModel
      .find({
        valuation_id: new mongoose.Types.ObjectId(valuation_id),
        status_delete_date: { $exists: false },
      })
      .exec();

    const statusMap = Object.fromEntries(
      Object.keys(ApplicationStatus)
        .filter((key) => !isNaN(Number(key)))
        .map((key) => {
          const status = Number(key);
          return [
            status,
            {
              application_status: i18n.t(
                `lang.application_status.status_${status}`,
              ),
              is_completed: 0,
              status_update_date: '',
            },
          ];
        }),
    );

    existingStatus.forEach(({ application_status, status_update_date }) => {
      const status = application_status as number;
      if (status in statusMap) {
        statusMap[status].is_completed = 1;
        statusMap[status].status_update_date = status_update_date;
      }
    });

    if (statusMap['3']?.is_completed === 1) {
      delete statusMap['4'];
    }
    if (statusMap['4']?.is_completed === 1) {
      delete statusMap['3'];
    }
    if (statusMap['6']?.is_completed === 1) {
      delete statusMap['7'];
    }
    if (statusMap['7']?.is_completed === 1) {
      delete statusMap['6'];
    }

    return Object.entries(statusMap).map(([status, details]) => ({
      valuation_id,
      application_status: details?.application_status,
      status_update_date: details?.status_update_date,
      is_completed: details?.is_completed,
    }));
  }

  async updateExtenLiquidityApplicationStatus(
    valuation_id: string,
    db_name: string,
  ): Promise<any> {
    this.loanApplicationStatusModel = setTanantConnection(
      db_name,
      LoanApplicationStatus.name,
      LoanStatusSchema,
    );
    const result = await this.loanApplicationStatusModel
      .updateMany(
        {
          valuation_id: new mongoose.Types.ObjectId(valuation_id),
          status_delete_date: null,
          application_status: { $gte: 5, $lte: 9 },
        },
        {
          $set: { status_delete_date: date_moment() },
        },
      )
      .exec();
    return result;
  }
}

import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { date_moment } from 'src/utils/date.util';
import { GoldLoanService } from 'src/app/gold_loan/gold_loan.service';
import { LoanEmi, LoanEmiSchema } from '../schema/loan_emi.schema';
import { EmiWeiveDTO, LoanEmiDTO } from '../dto/loan_emi.dto';
import { I18nContext } from 'nestjs-i18n';
import { Loan, LoanSchema } from '../schema/loan.schema';
import { AdminConfigService } from 'src/app/gold_loan/price_config.service';
import { formatCurrency, getStartAndEndTime } from 'src/utils/formate.util';
import { CustomerNotificationService } from 'src/app/notification/notification.service';
import { EmiStatus } from 'src/utils/enums.util';
import { EmailTemplateService } from 'src/app/email_template/email_template.service';
import { Customer, CustomerSchema } from 'src/customer/schema/customer.schema';
import * as moment from 'moment-timezone';
import { AuthService } from 'src/app/auth/auth.service';
import { StoreService } from 'src/app/store/store.service';

@Injectable()
export class LoanInstallmentService {
  public loanModel: Model<any>;
  public goldItemModel: Model<any>;
  public loanEmiModel: Model<any>;
  public appointmentModel: Model<any>;
  public customerModel: Model<any>;
  public valuationModel: Model<any>;

  constructor(
    @Inject(forwardRef(() => GoldLoanService))
    private readonly goldLoanService: GoldLoanService,
    @Inject(forwardRef(() => AdminConfigService))
    private readonly adminConfigService: AdminConfigService,
    @Inject(forwardRef(() => CustomerNotificationService))
    private readonly customerNotificationService: CustomerNotificationService,
    @Inject(forwardRef(() => EmailTemplateService))
    private readonly emailTemplateService: EmailTemplateService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => StoreService))
    private readonly storeService: StoreService,
  ) {}

  async addInstallments(db_name: string, loanEmiDTO: LoanEmiDTO): Promise<any> {
    this.loanEmiModel = setTanantConnection(
      db_name,
      LoanEmi.name,
      LoanEmiSchema,
    );

    const installmentValue =
      await this.goldLoanService.calculateInstallmentValue(
        loanEmiDTO?.margin,
        loanEmiDTO?.tenure_in_months,
      );
    const installmentDates = await this.goldLoanService.getInstallmentDates(
      loanEmiDTO.tenure_in_months,
    );

    for (let i = 0; i < loanEmiDTO.tenure_in_months; i++) {
      const installment = {
        loan_id: loanEmiDTO.loan_id,
        emi_number: i + 1,
        emi_payment_date: installmentDates[i],
        emi_amount: parseFloat(installmentValue.toFixed(2)),
        emi_created_date: date_moment(),
      };
      await this.loanEmiModel.create(installment);
    }
  }

  async getNextPendingEmi(
    db_name: string,
    loan_id: string,
  ): Promise<Date | null> {
    this.loanEmiModel = setTanantConnection(
      db_name,
      LoanEmi.name,
      LoanEmiSchema,
    );

    const emi = await this.loanEmiModel
      .findOne({
        loan_id: loan_id,
        emi_status: 'pending',
      })
      .sort({ emi_number: 1 })
      .exec();
    return emi?.['emi_payment_date'] || null;
  }

  async getInstallments(db_name: string, loan_id: string): Promise<LoanEmi[]> {
    this.loanEmiModel = setTanantConnection(
      db_name,
      LoanEmi.name,
      LoanEmiSchema,
    );
    const installments = await this.loanEmiModel.find({ loan_id: loan_id });
    return installments ? installments : [];
  }
  async penaltyCalculate(
    loan_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<LoanEmi[] | any> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    this.loanEmiModel = setTanantConnection(
      db_name,
      LoanEmi.name,
      LoanEmiSchema,
    );

    const loan = await this.loanModel.findOne({ _id: loan_id }).exec();
    if (!loan) {
      return false;
    }

    const [installments, priceConfig] = await Promise.all([
      this.getInstallments(db_name, loan_id),
      this.adminConfigService.getCustomerPriceConfig(
        loan.customer_id,
        db_name,
        i18n,
      ),
    ]);

    const currentDate = date_moment();
    const updatedInstallments = [];

    for (let index = 0; index < installments.length; index++) {
      const installment = installments[index];
      let penalty = 0;
      let totalDue = 0;

      if (
        currentDate > installment.emi_payment_date &&
        installment.penalty > 0 &&
        installment.total_due > 0 &&
        installment.emi_status === 'paid'
      ) {
        updatedInstallments.push({
          _id: installment._id,
          liquidity_id: installment.loan_id,
          emi_number: installment.emi_number,
          emi_amount: installment.emi_amount,
          emi_status: installment.emi_status,
          emi_payment_date: installment.emi_payment_date,
          emi_created_date: installment.emi_created_date,
          penalty: installment.penalty,
          total_due: installment.total_due,
          waiver_amount: installment.waiver_amount,
        });
        continue;
      }
      if (installment.emi_status !== 'paid') {
        if (index === 0 && currentDate > installment?.emi_payment_date) {
          penalty += (installment.emi_amount * priceConfig.penalty_rate) / 100;
          totalDue += penalty + installment.emi_amount;
        } else if (index > 0) {
          const previousInstallment = updatedInstallments[index - 1];
          if (previousInstallment?.emi_status === 'paid') {
            penalty +=
              (installment.emi_amount * priceConfig.penalty_rate) / 100;
            totalDue += penalty + installment.emi_amount;
          } else if (previousInstallment?.emi_status !== 'paid') {
            if (
              currentDate > previousInstallment?.emi_payment_date &&
              currentDate < installment?.emi_payment_date
            ) {
              if (previousInstallment?.waiver_amount > 0) {
                totalDue +=
                  previousInstallment?.waiver_amount + installment?.emi_amount;
              } else {
                totalDue +=
                  previousInstallment?.total_due + installment?.emi_amount;
              }
            } else if (currentDate > installment?.emi_payment_date) {
              if (previousInstallment?.waiver_amount > 0) {
                penalty +=
                  (previousInstallment.waiver_amount *
                    priceConfig.penalty_rate) /
                  100;
                totalDue +=
                  previousInstallment?.waiver_amount +
                  installment?.emi_amount +
                  penalty;
              } else {
                penalty +=
                  (previousInstallment.total_due * priceConfig.penalty_rate) /
                  100;
                totalDue +=
                  previousInstallment?.total_due +
                  installment?.emi_amount +
                  penalty;
              }
            }
          }
        }
        const updatedInstallment = await this.loanEmiModel
          .findOneAndUpdate(
            { _id: installment._id },
            {
              $set: {
                penalty: parseFloat(penalty.toFixed(2)),
                total_due: parseFloat(totalDue.toFixed(2)),
              },
            },
            { new: true, returnDocument: 'after' },
          )
          .exec();

        updatedInstallments.push({
          _id: updatedInstallment._id,
          loan_id: updatedInstallment.loan_id,
          emi_number: updatedInstallment.emi_number,
          emi_amount: updatedInstallment.emi_amount,
          emi_status: updatedInstallment.emi_status,
          emi_payment_date: updatedInstallment.emi_payment_date,
          emi_created_date: updatedInstallment.emi_created_date,
          penalty: updatedInstallment.penalty,
          total_due: updatedInstallment.total_due,
          waiver_amount: updatedInstallment.waiver_amount,
        });
      } else {
        updatedInstallments.push({
          _id: installment._id,
          liquidity_id: installment.loan_id,
          emi_number: installment.emi_number,
          emi_amount: installment.emi_amount,
          emi_status: installment.emi_status,
          emi_payment_date: installment.emi_payment_date,
          emi_created_date: installment.emi_created_date,
          penalty: 0,
          total_due: installment.emi_amount,
          waiver_amount: installment.waiver_amount,
        });
      }
    }
    return updatedInstallments;
  }

  async weiverCalculate(
    emiWeiveDTO: EmiWeiveDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.loanEmiModel = setTanantConnection(
      db_name,
      LoanEmi.name,
      LoanEmiSchema,
    );

    const installment = await this.loanEmiModel
      .findOne({ _id: emiWeiveDTO.loan_emi_id })
      .exec();
    if (!installment) {
      throw new BadRequestException(i18n.t(`lang.loan.intsallment_not_found`));
    }

    let waiver_amount = 0;
    let waive = 0;
    if (emiWeiveDTO.waiver_type === 'amount') {
      if (emiWeiveDTO.waiver_value > installment.penalty) {
        throw new BadRequestException(i18n.t(`lang.loan.invalid_waiver_value`));
      }
      waive =
        installment.penalty - (installment.penalty - emiWeiveDTO.waiver_value);
    } else if (emiWeiveDTO.waiver_type === 'percentage') {
      if (emiWeiveDTO.waiver_value > 100) {
        throw new BadRequestException(i18n.t(`lang.loan.invalid_waiver_value`));
      }
      waive = (installment.penalty * emiWeiveDTO.waiver_value) / 100;
    } else {
      throw new BadRequestException(i18n.t(`lang.loan.invalid_waiver_type`));
    }

    waiver_amount = installment.total_due - waive;
    if (emiWeiveDTO.is_waive === 0) {
      return {
        ...installment,
        waiver_type: emiWeiveDTO.waiver_type,
        waiver_value: emiWeiveDTO.waiver_value,
        waiver_amount: parseFloat(waiver_amount.toFixed(2)),
        waive: parseFloat(waive.toFixed(2)),
      };
    }
    const updatedInstallment = await this.loanEmiModel
      .findOneAndUpdate(
        { _id: emiWeiveDTO.loan_emi_id },
        {
          $set: {
            waiver_type: emiWeiveDTO.waiver_type,
            waiver_value: emiWeiveDTO.waiver_value,
            waiver_amount: parseFloat(waiver_amount.toFixed(2)),
            net_penalty: parseFloat((installment.penalty - waive).toFixed(2)),
          },
        },
        { new: true, returnDocument: 'after' },
      )
      .exec();

    await this.penaltyCalculate(updatedInstallment?.loan_id, db_name, i18n);
    return {
      ...updatedInstallment.toObject(),
      liquidity_id: updatedInstallment?.loan_id,
      waive: parseFloat(waive.toFixed(2)),
      loan_id: undefined,
    };
  }

  async updateInstallmentStatus(
    db_name: string,
    installment_id: string,
    emi_status: string,
    i18n: I18nContext,
    payment_method?: string,
  ): Promise<LoanEmi> {
    this.loanEmiModel = setTanantConnection(
      db_name,
      LoanEmi.name,
      LoanEmiSchema,
    );
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );
    const updatedInstallment = await this.loanEmiModel
      .findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(installment_id) },
        {
          $set: {
            emi_status: emi_status,
          },
        },
        { new: true, returnDocument: 'after' },
      )
      .exec();
    const nextInstallment = await this.loanEmiModel
      .findOne({
        loan_id: updatedInstallment?.loan_id,
        emi_number: updatedInstallment?.emi_number + 1,
      })
      .exec();

    const loan = await this.loanModel
      .findById(updatedInstallment.loan_id)
      .select('customer_id');
    const customer = await this.customerModel
      .findById(loan.customer_id)
      .select('first_name last_name email');

    const data = {
      customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
      transaction_date: moment(date_moment()).format('DD MMMM YYYY, h:mm A'),
      installment_amount: await formatCurrency(
        updatedInstallment?.emi_amount,
        i18n,
      ),
      payment_method: payment_method,
      next_installment_due_date: nextInstallment
        ? moment(nextInstallment?.emi_payment_date).format('DD MMMM YYYY')
        : 'NA',
    };
    await this.emailTemplateService.sendEmail(
      customer?.email,
      'installment_payment_success',
      db_name,
      data,
    );
    return updatedInstallment;
  }

  async getInstallmentOfAfterThreedays(db_name): Promise<any> {
    this.loanEmiModel = setTanantConnection(
      db_name,
      LoanEmi.name,
      LoanEmiSchema,
    );
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );
    const threeDaysFromNow = getStartAndEndTime(
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    );
    const installments = await this.loanEmiModel
      .find({
        emi_status: EmiStatus.PENDING,
        emi_payment_date: {
          $gte: threeDaysFromNow.startTime,
          $lte: threeDaysFromNow.endTime,
        },
      })
      .select('loan_id')
      .exec();
    installments.map(async (installment) => {
      const loan = await this.loanModel
        .findById(installment.loan_id)
        .select({ customer_id: 1, liquidate_number: 1 });

      const customer = await this.customerModel
        .findById(loan.customer_id)
        .select('first_name last_name email');

      this.customerNotificationService.sendPushNotification(
        (loan?.customer_id).toString(),
        'installment_reminder_before_three_days',
        'notification',
        3,
        db_name,
      );
      const data = {
        customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
        // liquidity_id: loan?.liquidate_number || '',
        due_date: '',
      };
      await this.emailTemplateService.sendEmail(
        customer?.email,
        'installment_reminder_before_three_days',
        db_name,
        data,
      );
    });
    return installments;
  }

  async getInstallmentOfAfterOneday(db_name): Promise<any> {
    this.loanEmiModel = setTanantConnection(
      db_name,
      LoanEmi.name,
      LoanEmiSchema,
    );
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    const tomorrow = getStartAndEndTime(
      new Date(Date.now() + 24 * 60 * 60 * 1000),
    );
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );

    const installments = await this.loanEmiModel
      .find({
        emi_status: EmiStatus.PENDING,
        emi_payment_date: {
          $gte: tomorrow.startTime,
          $lte: tomorrow.endTime,
        },
      })
      .select('loan_id')
      .exec();
    installments.map(async (installment) => {
      const loan = await this.loanModel
        .findById(installment.loan_id)
        .select('customer_id');
      const customer = await this.customerModel
        .findById(loan.customer_id)
        .select('first_name last_name email');

      const data = {
        customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
        due_date: moment(installment?.emi_payment_date).format('DD MMMM YYYY'),
      };
      await this.emailTemplateService.sendEmail(
        customer?.email,
        'installment_reminder_before_one_day',
        db_name,
        data,
      );
      await this.customerNotificationService.sendPushNotification(
        (loan?.customer_id).toString(),
        'installment_reminder_before_one_day',
        'notification',
        3,
        db_name,
      );
    });
    return installments;
  }

  async getInstallmentOfToday(db_name): Promise<any> {
    this.loanEmiModel = setTanantConnection(
      db_name,
      LoanEmi.name,
      LoanEmiSchema,
    );
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );
    const today = getStartAndEndTime(new Date());
    const installments = await this.loanEmiModel
      .find({
        emi_status: EmiStatus.PENDING,
        emi_payment_date: {
          $gte: today.startTime,
          $lte: today.endTime,
        },
      })
      .select('loan_id')
      .exec();
    installments.map(async (installment) => {
      const loan = await this.loanModel
        .findById(installment.loan_id)
        .select('customer_id');
      const customer = await this.customerModel
        .findById(loan.customer_id)
        .select('first_name last_name email');

      const data = {
        customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
        due_date: moment(installment?.emi_payment_date).format('DD MMMM YYYY'),
      };
      await this.emailTemplateService.sendEmail(
        customer?.email,
        'installment_reminder_before_one_day',
        db_name,
        data,
      );
      return this.customerNotificationService.sendPushNotification(
        (loan?.customer_id).toString(),
        'due_installment_reminder_same_day',
        'notification',
        3,
        db_name,
      );
    });
    return installments;
  }

  async addPenaltyOnInstallment(db_name, i18n): Promise<any> {
    this.loanEmiModel = setTanantConnection(
      db_name,
      LoanEmi.name,
      LoanEmiSchema,
    );
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );
    const today = getStartAndEndTime(new Date());
    const installments = await this.loanEmiModel
      .find({
        emi_status: EmiStatus.PENDING,
        emi_payment_date: {
          $gte: today.startTime,
          $lte: today.endTime,
        },
      })
      .select('loan_id emi_amount')
      .exec();
    installments.map(async (installment) => {
      const emi_with_penalty = await this.penaltyCalculate(
        installment.loan_id,
        db_name,
        i18n,
      );
      const installmentsWithPenalty = emi_with_penalty?.filter(
        (installment) => installment.penalty > 0,
      );

      const loan = await this.loanModel
        .findById(installment.loan_id)
        .select('customer_id');
      const customer = await this.customerModel
        .findById(loan.customer_id)
        .select('first_name last_name email');

      const data = {
        customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
        due_date: moment(installment?.emi_payment_date).format('DD MMMM YYYY'),
        penalty_fee: await formatCurrency(
          installmentsWithPenalty[0]?.penalty,
          i18n,
        ),
        installment_amount: await formatCurrency(installment?.emi_amount, i18n),
      };

      if (loan?.branch_id) {
        const branch_details = await this.storeService.getStoreDetails(
          loan?.branch_id.toString(),
          db_name,
        );
        const store_owner_details = await this.authService.getUserProfile(
          branch_details?.branch_owner_id.toString(),
          db_name,
        );

        const data = {
          due_date: moment(installment?.emi_payment_date).format(
            'DD MMMM YYYY',
          ),
          penalty_fee: await formatCurrency(
            installmentsWithPenalty[0]?.penalty,
            i18n,
          ),
          installment_amount: await formatCurrency(
            installment?.emi_amount,
            i18n,
          ),
          support_phone: store_owner_details?.mobile_number || '',
          support_email: store_owner_details?.email || '',
        };
        await this.emailTemplateService.sendEmail(
          customer?.email,
          'installment_missed',
          db_name,
          data,
        );
      }
      await this.customerNotificationService.sendPushNotification(
        (loan?.customer_id).toString(),
        'installment_missed',
        'notification',
        3,
        db_name,
      );
    });
    return installments;
  }

  async getInstallmentOfTodayMaturity(db_name): Promise<any> {
    this.loanEmiModel = setTanantConnection(
      db_name,
      LoanEmi.name,
      LoanEmiSchema,
    );
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    const today = getStartAndEndTime(new Date());
    const installments = await this.loanEmiModel
      .find({
        emi_number: 3,
        emi_status: EmiStatus.PENDING,
        emi_payment_date: {
          $gte: today.startTime,
          $lte: today.endTime,
        },
      })
      .select('loan_id')
      .exec();
    installments.map(async (installment) => {
      const loan = await this.loanModel
        .findById(installment.loan_id)
        .select('customer_id');
      return this.customerNotificationService.sendPushNotification(
        (loan?.customer_id).toString(),
        'liquidity_maturity_today',
        'notification',
        3,
        db_name,
      );
    });
    return installments;
  }

  async getMaturityAfterTwoDay(db_name, i18n): Promise<any> {
    this.loanEmiModel = setTanantConnection(
      db_name,
      LoanEmi.name,
      LoanEmiSchema,
    );
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    const today = getStartAndEndTime(
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    );
    const installments = await this.loanEmiModel
      .find({
        emi_number: 3,
        emi_status: EmiStatus.PENDING,
        emi_payment_date: {
          $gte: today.startTime,
          $lte: today.endTime,
        },
      })
      .select('loan_id')
      .exec();
    installments.map(async (installment) => {
      const loan = await this.loanModel
        .findById(installment.loan_id)
        .select('customer_id available_liquidity_to_customer');

      const customer = await this.customerModel
        .findById(loan.customer_id)
        .select('first_name last_name email');

      if (loan?.branch_id) {
        const branch_details = await this.storeService.getStoreDetails(
          loan?.branch_id.toString(),
          db_name,
        );
        const store_owner_details = await this.authService.getUserProfile(
          branch_details?.branch_owner_id.toString(),
          db_name,
        );

        const data = {
          customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
          maturity_date: moment(installment?.emi_payment_date).format(
            'DD MMMM YYYY',
          ),
          available_liquidity_to_customer: await formatCurrency(
            loan?.available_liquidity_to_customer,
            i18n,
          ),
          support_phone: store_owner_details?.mobile_number || '',
          support_email: store_owner_details?.email || '',
        };
        await this.emailTemplateService.sendEmail(
          customer?.email,
          'liquidity_maturity_after_two_days',
          db_name,
          data,
        );
      }

      return this.customerNotificationService.sendPushNotification(
        (loan?.customer_id).toString(),
        'liquidity_maturity_after_two_days',
        'notification',
        3,
        db_name,
      );
    });
    return installments;
  }
}

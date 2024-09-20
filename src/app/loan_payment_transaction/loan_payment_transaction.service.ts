import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { LoanPaymentTransactionDTO } from './dto/loan_payment_transaction.dto';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import {
  LoanPaymentTransaction,
  LoanPaymentTransactionSchema,
} from './schema/loan_payment_transaction.schema';
import { date_moment, format_date } from 'src/utils/date.util';
import { I18nContext } from 'nestjs-i18n';
import { GoldLoanService } from '../gold_loan/gold_loan.service';
import { LoanService } from '../loan/service/loan.service';
import { StaffNotificationsService } from '../staff_notifications/staff_notifications.service';
import { CustomerService } from 'src/customer/service/customer.service';
import { Loan, LoanSchema } from '../loan/schema/loan.schema';
import { CustomerNotificationService } from '../notification/notification.service';
import { LoanInstallmentService } from '../loan/service/loan_emi.service';
import { EmailTemplateService } from '../email_template/email_template.service';
import { formatCurrency } from 'src/utils/formate.util';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class LoanPaymentTransactionService {
  public loanPaymentTransactionModel: Model<any>;
  private loanModel: Model<Loan>;
  constructor(
    @Inject(forwardRef(() => GoldLoanService))
    private readonly goldLoanService: GoldLoanService,
    @Inject(forwardRef(() => LoanService))
    private readonly loanService: LoanService,
    @Inject(forwardRef(() => StaffNotificationsService))
    private readonly staffNotificationsService: StaffNotificationsService,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => CustomerNotificationService))
    private readonly customerNotificationService: CustomerNotificationService,
    @Inject(forwardRef(() => LoanInstallmentService))
    private readonly loanInstallmentService: LoanInstallmentService,
    @Inject(forwardRef(() => EmailTemplateService))
    private readonly emailTemplateService: EmailTemplateService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  async addTransaction(
    loanPaymentTransactionDTO: LoanPaymentTransactionDTO,
    user_id: string,
    store_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.loanPaymentTransactionModel = setTanantConnection(
      db_name,
      LoanPaymentTransaction.name,
      LoanPaymentTransactionSchema,
    );

    loanPaymentTransactionDTO.payment_date = date_moment();
    const newTransaction = new this.loanPaymentTransactionModel(
      loanPaymentTransactionDTO,
    );
    await newTransaction.save();

    const transactionStatus = newTransaction.transaction_status.toLowerCase();
    const isCredited = loanPaymentTransactionDTO.payment_status === 'credited';
    const isSuccessful =
      transactionStatus === 'successful' || transactionStatus === 'success';
    const customer = await this.customerService.getUserProfile(
      loanPaymentTransactionDTO.customer_id,
      db_name,
    );
    if (isCredited && isSuccessful) {
      await this.loanService.updateLoanStatus(
        db_name,
        {
          loan_id: loanPaymentTransactionDTO.loan_id,
          verifier_id: user_id,
          verification_office_id: store_id ? store_id : null,
          is_verified: true,
        },
        i18n,
      );

      const loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);

      const liquidationDetails = await loanModel.findOne({
        _id: loanPaymentTransactionDTO.loan_id,
      });
      const placeholders = {
        liquidity_id: liquidationDetails?.liquidate_number ?? '',
        customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
      };

      // Send push notification Staff side
      await this.staffNotificationsService.sendPushNotification(
        user_id,
        'liquidity_disbursed',
        'notification',
        3,
        db_name,
        user_id,
        null,
        placeholders,
      );

      // Send push notification Customer side
      await this.customerNotificationService.sendPushNotification(
        (customer?._id).toString(),
        'liquidity_approved', //loan_amount_transfer_to_customer_account
        'notification',
        2,
        db_name,
      );
      // Send email Customer side
      if (customer?.email) {
        const formattedDate = format_date(
          'DD MMMM YYYY',
          newTransaction?.payment_date,
        );
        const data = {
          customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
          liquidity_number: liquidationDetails?.liquidate_number ?? '',
          account_number: newTransaction?.number ?? '',
          amount:
            (await formatCurrency(newTransaction?.transaction_amount, i18n)) ??
            '',
          date: formattedDate,
        };
        await this.emailTemplateService.sendEmail(
          customer?.email,
          'liquidity_disbursed',
          db_name,
          data,
        );
      }
    } else if (
      loanPaymentTransactionDTO?.payment_status === 'debited' &&
      loanPaymentTransactionDTO?.loan_emi_id &&
      transactionStatus &&
      (transactionStatus === 'successful' || transactionStatus === 'success')
    ) {
      await this.loanInstallmentService.updateInstallmentStatus(
        db_name,
        loanPaymentTransactionDTO.loan_emi_id,
        'paid',
        i18n,
        loanPaymentTransactionDTO?.transaction_method,
      );
      await this.customerNotificationService.sendPushNotification(
        (customer?._id).toString(),
        'installment_payment_success',
        'notification',
        2,
        db_name,
      );
    } else if (isCredited && !isSuccessful) {
      throw new BadRequestException(
        i18n.t(`lang.loan.loan_transaction_failed`),
      );
    }
    const loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    const liquidationDetails = await loanModel.findOne({
      _id: loanPaymentTransactionDTO.loan_id,
    });

    const staff = await this.authService.getUserProfile(
      liquidationDetails?.verifier_id.toString(),
      db_name,
    );
    return {
      liquidity_id: liquidationDetails?.liquidate_number ?? '',
      transaction_id: newTransaction?.transaction_id ?? '',
      verification_date: liquidationDetails?.verification_date ?? '',
      verifier_name: `${staff?.first_name ?? ''} ${staff?.last_name ?? ''}`,
      verifier_email: staff?.email ?? '',
      verifier_phone: staff?.mobile_number ?? '',
    };
  }

  async getTransactions(
    db_name: string,
    user_id: string,
    store_id: string,
    i18n: I18nContext,
  ): Promise<LoanPaymentTransaction[]> {
    this.loanPaymentTransactionModel = setTanantConnection(
      db_name,
      LoanPaymentTransaction.name,
      LoanPaymentTransactionSchema,
    );
    const transactions = await this.loanPaymentTransactionModel
      .aggregate([
        {
          $lookup: {
            from: 'customer',
            localField: 'customer_id',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $unwind: '$customer_details',
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
          $match: {
            ...(store_id
              ? {
                  'loan_details.branch_id': new mongoose.Types.ObjectId(
                    store_id,
                  ),
                }
              : {}),
          },
        },
        {
          $project: {
            _id: 1,
            loan_id: 1,
            transaction_method: 1,
            transaction_status: 1,
            transaction_id: 1,
            transaction_details: 1,
            payment_date: 1,
            payment_status: 1,
            created_at: 1,
            store_id: 1,
            description: 1,
            transaction_amount: 1,
            transaction_fees: 1,
            transaction_vat: 1,
            number: 1,
            customer_id: '$customer_details._id',
            full_name: {
              $concat: [
                '$customer_details.first_name',
                ' ',
                '$customer_details.last_name',
              ],
            },
            mobile_number: {
              $concat: [
                '$customer_details.country_code',
                '$customer_details.phone',
              ],
            },
            profile_image: { $ifNull: ['$customer_details.profile_image', ''] },
            email: { $ifNull: ['$customer_details.email', ''] },
            liquidate_number: '$loan_details.liquidate_number',
          },
        },
      ])
      .exec();

    const formattedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        transaction.transaction_amount =
          await this.goldLoanService.formatCurrency(
            transaction.transaction_amount,
            i18n,
          );
        return transaction;
      }),
    );

    return formattedTransactions;
  }

  async getLoanTransactions(
    loan_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<LoanPaymentTransaction[] | []> {
    this.loanPaymentTransactionModel = setTanantConnection(
      db_name,
      LoanPaymentTransaction.name,
      LoanPaymentTransactionSchema,
    );
    const loan_transactions = await this.loanPaymentTransactionModel
      .aggregate([
        {
          $match: {
            loan_id: new mongoose.Types.ObjectId(loan_id),
          },
        },
        {
          $lookup: {
            from: 'loanemis',
            localField: 'loan_emi_id',
            foreignField: '_id',
            as: 'loan_emi_details',
          },
        },
        {
          $unwind: {
            path: '$loan_emi_details',
            preserveNullAndEmptyArrays: true,
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
            _id: 1,
            liquidity_installment_id: { $ifNull: ['$loan_emi_id', ' '] },
            liquidity_id: '$loan_id',
            liquidate_number: {
              $ifNull: ['$loan_details.liquidate_number', ''],
            },
            transaction_method: 1,
            transaction_status: 1,
            transaction_id: 1,
            transaction_details: 1,
            payment_date: 1,
            created_at: 1,
            store_id: 1,
            description: 1,
            payment_status: 1,
            transaction_amount: { $ifNull: ['$transaction_amount', 0] },
            transaction_fees: 1,
            transaction_vat: 1,
            number: 1,
            emi_number: { $ifNull: ['$loan_emi_details.emi_number', 0] },
            penalty: { $ifNull: ['$loan_emi_details.penalty', 0] },
            total_due: { $ifNull: ['$loan_emi_details.total_due', 0] },
            waiver_type: { $ifNull: ['$loan_emi_details.waiver_type', ''] },
            penalty_weive: { $ifNull: ['$loan_emi_details.waiver_value', 0] },
            net_penalty: { $ifNull: ['$loan_emi_details.net_penalty', 0] },
            waiver_amount: { $ifNull: ['$loan_emi_details.waiver_amount', 0] },
          },
        },
      ])
      .then(async (result) => {
        return await Promise.all(
          result.map(async (transaction) => {
            transaction.transaction_amount =
              await this.goldLoanService.formatCurrency(
                transaction?.transaction_amount || 0,
                i18n,
              );
            let formattedPenaltyWeive: string;
            if (transaction.waiver_type === 'percentage') {
              formattedPenaltyWeive = `${transaction.penalty_weive}%`;
            } else {
              formattedPenaltyWeive = await this.goldLoanService.formatCurrency(
                transaction.penalty_weive,
                i18n,
              );
            }
            transaction.penalty = await this.goldLoanService.formatCurrency(
              transaction.penalty,
              i18n,
            );
            transaction.total_due = await this.goldLoanService.formatCurrency(
              transaction.total_due,
              i18n,
            );
            transaction.penalty_weive = formattedPenaltyWeive;
            transaction.net_penalty = await this.goldLoanService.formatCurrency(
              transaction.net_penalty,
              i18n,
            );
            transaction.waiver_amount =
              await this.goldLoanService.formatCurrency(
                transaction.waiver_amount,
                i18n,
              );
            return transaction;
          }),
        );
      });

    return loan_transactions;
  }

  async findEmiTransaction(loan_emi_id: string, db_name): Promise<string> {
    this.loanPaymentTransactionModel = setTanantConnection(
      db_name,
      LoanPaymentTransaction.name,
      LoanPaymentTransactionSchema,
    );
    const emiTransaction = await this.loanPaymentTransactionModel
      .findOne({
        loan_emi_id,
      })
      .sort({ payment_date: -1 })
      .exec();
    return emiTransaction?.transaction_id || '-';
  }
}

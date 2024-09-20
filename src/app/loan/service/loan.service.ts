import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import mongoose, { Model, PipelineStage } from 'mongoose';
import { Loan, LoanSchema } from '../schema/loan.schema';
import { CreateLoanDto, LoanCloserDto, LoanDTO } from '../dto/loan.dto';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { date_moment } from 'src/utils/date.util';
import {
  GetLoanDTO,
  UpdateLoanDTO,
  UpdateLoanStatus,
} from '../dto/update_loan.dto';
import { GoldLoanService } from 'src/app/gold_loan/gold_loan.service';
import { AppointmentService } from '../../appointment/services/appointment.service';
import { I18nContext } from 'nestjs-i18n';
import { CustomerService } from 'src/customer/service/customer.service';
import { StoreService } from '../../store/store.service';
import { LoanPaymentTransactionService } from '../../loan_payment_transaction/loan_payment_transaction.service';
import { ApplicationStatusService } from '../../appointment/services/application_status.service';
import { AgreementTemplateService } from 'src/app/agreement_template/agreement_template.service';
import { AuthService } from 'src/app/auth/auth.service';
import { GoldItemService } from './gold_item.service';
import { LoanInstallmentService } from './loan_emi.service';
import { CustomerNotificationService } from 'src/app/notification/notification.service';
import { EmailTemplateService } from 'src/app/email_template/email_template.service';
import { formatCurrency } from 'src/utils/formate.util';

@Injectable()
export class LoanService {
  public loanModel: Model<any>;
  public goldItemModel: Model<any>;
  public loanEmiModel: Model<any>;
  public appointmentModel: Model<any>;
  public customerModel: Model<any>;
  public valuationModel: Model<any>;

  constructor(
    @Inject(forwardRef(() => GoldLoanService))
    private readonly goldLoanService: GoldLoanService,
    @Inject(forwardRef(() => AppointmentService))
    private readonly appointmentService: AppointmentService,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => StoreService))
    private readonly storeService: StoreService,
    @Inject(forwardRef(() => LoanPaymentTransactionService))
    private readonly loanPaymentTransactionService: LoanPaymentTransactionService,
    @Inject(forwardRef(() => ApplicationStatusService))
    private readonly applicationStatusService: ApplicationStatusService,
    @Inject(forwardRef(() => AgreementTemplateService))
    private readonly agreementTemplateService: AgreementTemplateService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => GoldItemService))
    private readonly goldItemService: GoldItemService,
    @Inject(forwardRef(() => LoanInstallmentService))
    private readonly loanInstallmentService: LoanInstallmentService,
    @Inject(forwardRef(() => CustomerNotificationService))
    private readonly customerNotificationService: CustomerNotificationService,
    @Inject(forwardRef(() => EmailTemplateService))
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  async findLoanByValuation(
    valuation_id: string,
    db_name: string,
  ): Promise<Loan> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    const loan = await this.loanModel
      .findOne({
        valuation_id: new mongoose.Types.ObjectId(valuation_id),
      })
      .exec();
    return loan;
  }

  async findGenerateLoanDetails(
    valuation_id: string,
    customer_id: string,
    specification: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    const initialValuationDetails =
      await this.goldLoanService.getCustomerLoanEstimation(
        valuation_id,
        customer_id,
        db_name,
      );

    const calculation = await this.goldLoanService.goldLoanCalculate(
      {
        tenure_in_months: initialValuationDetails.tenure_in_months,
        customer_cash_needs: initialValuationDetails.customer_cash_needs,
        gold_weight: initialValuationDetails.gold_weight,
        gold_purity_entered_per_1000:
          initialValuationDetails.gold_purity_entered_per_1000,
        valuation_id: initialValuationDetails?.id,
        specification: specification,
      },
      customer_id,
      db_name,
      i18n,
    );

    return {
      customer_cash_needs: parseFloat(
        (initialValuationDetails?.customer_cash_needs).toFixed(2),
      ),
      gold_rate_at_valuation: parseFloat(
        (initialValuationDetails?.gold_rate_at_valuation).toFixed(2),
      ),
      gold_weight: parseFloat(
        (initialValuationDetails?.gold_weight).toFixed(2),
      ),
      gold_purity_entered_per_1000: parseFloat(
        (initialValuationDetails?.gold_purity_entered_per_1000).toFixed(2),
      ),
      gold_piece_value: parseFloat(calculation.gold_piece_value.toFixed(2)),
      cash_to_customer: parseFloat(calculation.cash_to_customer.toFixed(2)),
      karatage_price_per_gram: parseFloat(
        calculation.karatage_price_per_gram.toFixed(2),
      ),
      admin_purchase_fees: parseFloat(
        calculation.admin_purchase_fees.toFixed(2),
      ),
      net_purchase_price_from_customer: parseFloat(
        calculation.net_purchase_price_from_customer.toFixed(2),
      ),
      buy_back_price: parseFloat(calculation.buy_back_price.toFixed(2)),
      margin: parseFloat(calculation.margin.toFixed(2)),
      advance_payment_by_customer: parseFloat(
        calculation.advance_payment_by_customer.toFixed(2),
      ),
      balance_to_complete_buyback_back: parseFloat(
        calculation.balance_to_complete_buyback_back.toFixed(2),
      ),
      available_liquidity_to_customer: parseFloat(
        calculation.available_liquidity_to_customer.toFixed(2),
      ),
      margin_rate: initialValuationDetails.margin_rate,
      reserve_rate: initialValuationDetails?.reserve_rate,
      admin_fee_rate: initialValuationDetails?.admin_fee_rate,
      admin_fee_rate_renewal: initialValuationDetails?.admin_fee_rate_renewal,
      gold_price_24_karate: initialValuationDetails?.gold_price_24_karate,
      tenure_in_months: initialValuationDetails?.tenure_in_months,
      customer_id: customer_id,
      liquidation_cost_rate: calculation?.liquidation_cost_rate,
      liquidation_costs: parseFloat(
        (calculation?.liquidation_costs).toFixed(2),
      ),
      new_gold_liquidation_value: parseFloat(
        (calculation?.new_gold_liquidation_value).toFixed(2),
      ),
      funds_due_to_customer: parseFloat(
        (calculation?.funds_due_to_customer).toFixed(2),
      ),
    };
  }

  async findExtendLoanGenerateDetails(
    parent_loan_id: string,
    topup_request,
    tenure,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    const existingLoan = await this.loanModel
      .findOne({
        _id: parent_loan_id,
      })
      .exec();

    const extendDetails = await this.goldLoanService.goldLoanRenewal(
      existingLoan?.customer_id,
      {
        remaining_balance: existingLoan?.balance_to_complete_buyback_back,
        customer_request_topup: topup_request,
        weight: existingLoan?.gold_weight,
        goldPurityEnteredPer1000: existingLoan?.gold_purity_entered_per_1000,
        buyBackTermInMonths: tenure,
      },
      db_name,
      i18n,
    );
    return {
      customer_cash_needs: parseFloat(
        (existingLoan?.customer_cash_needs).toFixed(2),
      ),
      gold_rate_at_valuation: parseFloat(
        (extendDetails?.goldPieceValue).toFixed(2),
      ),
      gold_weight: existingLoan?.gold_weight,
      gold_purity_entered_per_1000: existingLoan?.gold_purity_entered_per_1000,
      gold_piece_value: parseFloat(extendDetails.goldPieceValue.toFixed(2)),
      cash_to_customer: parseFloat(extendDetails.customerNewBalance.toFixed(2)),
      karatage_price_per_gram: parseFloat(
        extendDetails.karatagePricePerGram.toFixed(2),
      ),
      admin_purchase_fees: parseFloat(
        extendDetails.adminFeesRenewal.toFixed(2),
      ),
      net_purchase_price_from_customer: parseFloat(
        extendDetails.netPurChasePriceFromCustomer.toFixed(2),
      ),
      buy_back_price: parseFloat(extendDetails.buyBackPrice.toFixed(2)),
      margin: parseFloat(extendDetails.margin.toFixed(2)),
      advance_payment_by_customer: parseFloat(
        extendDetails.advancePaymentByCustomer.toFixed(2),
      ),
      balance_to_complete_buyback_back: parseFloat(
        extendDetails.balanceToCompleteSellback.toFixed(2),
      ),
      available_liquidity_to_customer: parseFloat(
        extendDetails.available_liquidity_to_customer.toFixed(2),
      ),
      margin_rate: extendDetails.margin_rate,
      reserve_rate: extendDetails?.reserve_rate,
      admin_fee_rate: extendDetails?.admin_fee_rate,
      admin_fee_rate_renewal: extendDetails?.admin_fee_rate_renewal,
      gold_price_24_karate: extendDetails?.gold_price_24_karate,
      tenure_in_months: tenure,
      customer_id: existingLoan?.customer_id,
      top_up_requested: topup_request,
      top_up_value: parseFloat((extendDetails?.availableTopUpValue).toFixed(2)),
      balance_to_paid_by_customer: parseFloat(
        (extendDetails?.balaceToPaidByCustomer).toFixed(2),
      ),
      liquidation_cost_rate: extendDetails?.liquidation_cost_rate,
      liquidation_costs: parseFloat(
        (extendDetails?.liquidation_costs).toFixed(2),
      ),
      new_gold_liquidation_value: parseFloat(
        (extendDetails?.new_gold_liquidation_value).toFixed(2),
      ),
      funds_due_to_customer: parseFloat(
        (extendDetails?.funds_due_to_customer).toFixed(2),
      ),
    };
  }

  async applyLoan(
    loanDTO: LoanDTO,
    user_id: string,
    db_name: string,
    branch_id: string,
    i18n: I18nContext,
  ): Promise<Loan | any> {
    const {
      customer_id,
      valuation_id,
      specification,
      item,
      parent_loan_id,
      tenure,
      topup_request,
    } = loanDTO;
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    let gold_loan_calculated_details;
    if (loanDTO.parent_loan_id) {
      gold_loan_calculated_details = await this.findExtendLoanGenerateDetails(
        parent_loan_id,
        topup_request,
        tenure,
        db_name,
        i18n,
      );
    } else {
      gold_loan_calculated_details = await this.findGenerateLoanDetails(
        valuation_id,
        customer_id,
        specification,
        db_name,
        i18n,
      );
    }
    const loan = await this.addLoan(
      {
        parent_loan_id,
        customer_id: gold_loan_calculated_details?.customer_id,
        valuation_id,
        ...gold_loan_calculated_details,
        transaction_date: date_moment(),
        assets_base_url: '',
        specification,
        item: item,
        liquidate_number: '',
        loan_status: '',
        branch_id,
      },
      user_id,
      db_name,
      i18n,
    );

    // Extend Process Initiated send push notification to customer if customer extends
    if (parent_loan_id) {
      await this.customerNotificationService.sendPushNotification(
        (gold_loan_calculated_details?.customer_id).toString(),
        'extend_process',
        'notification',
        3,
        db_name,
      );
      const customer = await this.customerService.getUserProfile(
        loan?.customer_id.toString(),
        db_name,
      );

      if (customer) {
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
            support_phone: store_owner_details?.mobile_number || '',
            support_email: store_owner_details?.email || '',
          };
          await this.emailTemplateService.sendEmail(
            customer?.email,
            'extension_process',
            db_name,
            data,
          );
        }
      }
    }

    const notification =
      await this.customerNotificationService.sendPushNotification(
        (gold_loan_calculated_details?.customer_id).toString(),
        'generate_agreement',
        'notification',
        3,
        db_name,
        null,
        { loan_id: loan?.id, screen: 'Dashboard' },
      );

    const aggrements = await this.agreementTemplateService.getAgreementTemplate(
      { loan_id: loan?.id, agreement_type: 1 },
      'agreement_generate',
      db_name,
      i18n,
    );

    await this.updateLoanStatus(
      db_name,
      {
        unsigned_agreements: aggrements.agreement_url,
        loan_id: loan?.id,
      },
      i18n,
    );

    return {
      liquidity_id: loan?.id,
      liquidity_number: loan?.liquidate_number,
      valuation_id: valuation_id,
      customer_id: customer_id,
      is_verified: loan?.is_verified,
      agreement_type: 1,
      agreements: aggrements.agreements_details,
      agreement_pdf_url: aggrements.agreement_url,
    };
  }

  async addLoan(
    createLoan: CreateLoanDto,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<Loan | any> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    let existingLoan: null;
    if (createLoan?.valuation_id && createLoan?.valuation_id !== null) {
      existingLoan = await this.loanModel
        .findOne({
          valuation_id: createLoan.valuation_id,
        })
        .exec();
    }

    if (!existingLoan) {
      if (createLoan?.parent_loan_id) {
        const parentLoan = await this.loanModel
          .findOne({
            _id: new mongoose.Types.ObjectId(createLoan.parent_loan_id),
          })
          .exec();
        createLoan.valuation_id = parentLoan.valuation_id;
      }
      createLoan.created_by = user_id;
      createLoan.loan_status = 'InActive';
      createLoan.transaction_date = date_moment();

      let liquidateNumber: string;
      let existingLiquidateLoan: string;

      do {
        liquidateNumber = `LI${new Date().getTime()}`;
        existingLiquidateLoan = await this.loanModel
          .findOne({
            liquidate_number: liquidateNumber,
          })
          .exec();
      } while (existingLiquidateLoan);
      createLoan.liquidate_number = liquidateNumber;

      const newLoan = new this.loanModel(createLoan);
      await newLoan.save();
      if (createLoan?.parent_loan_id) {
        await this.applicationStatusService.updateExtenLiquidityApplicationStatus(
          createLoan?.valuation_id,
          db_name,
        );
      }
      await this.applicationStatusService.updateApplicationStatus(
        {
          loan_id: null,
          valuation_id: createLoan?.valuation_id,
          application_status: 5,
          status_update_date: null,
          reason_for_rejection: null,
        },
        db_name,
        i18n,
      );

      if (createLoan?.item) {
        const initialValuationDetails =
          await this.goldLoanService.getCustomerLoanEstimation(
            createLoan.valuation_id,
            createLoan?.customer_id,
            db_name,
          );
        await Promise.all(
          Object.keys(createLoan.item).map(async (key) => {
            await this.goldItemService.addGoldItem(
              {
                valuation_id: initialValuationDetails.id,
                gold_weight: createLoan.item[key]?.gold_weight,
                gold_purity_entered_per_1000:
                  createLoan.item[key]?.gold_purity_entered_per_1000,
                name: createLoan.item[key]?.name,
                asset_images: createLoan.item[key]?.asset_images,
                specification: createLoan.item[key]?.specification,
                liquidate_number:newLoan?.liquidate_number,
                barcode_number: createLoan?.item[key]?.barcode_number
              },
              db_name,
              i18n,
            );
          }),
        );
      }

      await this.loanInstallmentService.addInstallments(db_name, {
        loan_id: newLoan?.id,
        tenure_in_months: newLoan?.tenure_in_months,
        margin: newLoan?.margin,
        loan_transaction_date: newLoan?.transaction_date,
        emi_number: null,
        emi_amount: null,
        emi_payment_date: null,
        emi_created_date: date_moment(),
      });
      return newLoan;
    } else {
      throw new BadRequestException(i18n.t(`lang.loan.loan_exist`));
    }
  }

  async updateLoanStatus(
    db_name: string,
    updateLoanDTO: UpdateLoanDTO,
    i18n: I18nContext,
    user_id?: string,
    store_id?: string,
  ): Promise<Loan | any> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    try {
      const loanUpdateData: any = {
        ...updateLoanDTO,
        ...(updateLoanDTO?.verifier_id
          ? { verification_date: date_moment(), loan_status: 'Active' }
          : null),
      };

      if (
        updateLoanDTO?.signed_agreements &&
        updateLoanDTO?.signed_agreements.length > 0
      ) {
        loanUpdateData.signed_agreements = updateLoanDTO.signed_agreements.map(
          (agreement) => ({
            ...agreement,
            created_date: date_moment(),
          }),
        );
      }

      if (updateLoanDTO?.signed_fullfillment_agreement) {
        const agreement = updateLoanDTO.signed_fullfillment_agreement;
        loanUpdateData.loan_status = 'BuyBack Completed';
        loanUpdateData.signed_fullfillment_agreement = {
          ...agreement,
          created_date: date_moment(),
        };
      }

      if (updateLoanDTO?.signed_liquidate_agreement) {
        const agreement = updateLoanDTO.signed_liquidate_agreement;
        loanUpdateData.loan_status = 'Liquidate';
        loanUpdateData.signed_liquidate_agreement = {
          ...agreement,
          created_date: date_moment(),
        };
      }

      const loan = await this.loanModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(updateLoanDTO.loan_id) },
        { $set: loanUpdateData },
        { new: true },
      );
      if (!loan) {
        throw new BadRequestException(i18n.t(`lang.loan.loan_not_found`));
      }

      if (updateLoanDTO?.verifier_id && updateLoanDTO?.verification_office_id) {
        if (loan?.parent_loan_id) {
          await this.loanModel.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(loan.parent_loan_id) },
            { $set: { loan_status: 'Extend' } },
            { new: true },
          );
        }
        await this.goldLoanService.updateInitialValuationStatus(
          loan?.valuation_id,
          loan.customer_id,
          db_name,
        );
        await this.appointmentService.updateAppointmentStatus(db_name, {
          valuation_id: loan?.valuation_id,
          is_branch_visited: true,
        });
        await this.applicationStatusService.updateApplicationStatus(
          {
            loan_id: null,
            valuation_id: (loan?.valuation_id).toString(),
            application_status: 9,
            reason_for_rejection: null,
            status_update_date: null,
          },
          db_name,
          i18n,
        );
      }

      const customer = await this.customerService.getUserProfile(
        (loan?.customer_id).toString(),
        db_name,
      );
      if (
        updateLoanDTO?.signed_agreements &&
        updateLoanDTO?.signed_agreements.length > 0 &&
        loan?.signed_agreements &&
        loan?.signed_agreements.length > 0
      ) {
        if (loan?.parent_loan_id && loan?.top_up_value <= 0) {
          await this.loanModel.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(loan._id) },
            {
              $set: {
                loan_status: 'Active',
                is_verified: true,
                verifier_id: user_id,
                verification_office_id: store_id,
              },
            },
            { new: true },
          );
          await this.loanModel.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(loan.parent_loan_id) },
            { $set: { loan_status: 'Extend' } },
            { new: true },
          );
        }
        await this.applicationStatusService.updateApplicationStatus(
          {
            loan_id: null,
            valuation_id: (loan?.valuation_id).toString(),
            application_status: 8,
            reason_for_rejection: null,
            status_update_date: null,
          },
          db_name,
          i18n,
        );
        await this.customerNotificationService.sendPushNotification(
          loan?.customer_id.toString(),
          'uploaded_signed_contract',
          'notification',
          3,
          db_name,
        );
        if (customer?.email) {
          const data = {
            customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
            liquidity_number: loan?.liquidate_number ?? '',
          };
          await this.emailTemplateService.sendEmail(
            customer?.email,
            'agreement_signed',
            db_name,
            data,
          );
        }
      }

      if (
        updateLoanDTO?.signed_fullfillment_agreement ||
        (updateLoanDTO?.signed_liquidate_agreement &&
          loan?.signed_fullfillment_agreement) ||
        loan?.signed_liquidate_agreement
      ) {
        this.customerNotificationService.sendPushNotification(
          (loan?.customer_id).toString(),
          'liquidity_closure_alert',
          'notification',
          2,
          db_name,
        );
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
            liquidity_number: loan?.liquidate_number,
            customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
            support_phone: store_owner_details?.mobile_number || '',
            support_email: store_owner_details?.email || '',
          };
          await this.emailTemplateService.sendEmail(
            customer?.email,
            'liquidity_closure_alert',
            db_name,
            data,
          );
        }
      }

      //TODO:SEND EMAIL liquidate  closer
      // if (updateLoanDTO?.signed_fullfillment_agreement && loan?.signed_fullfillment_agreement){
      //   if (customer?.email) {
      //     const data = {
      //       customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
      //     }
      //     await this.emailTemplateService.sendEmail(customer?.email, "liquidity_closure", db_name, data);
      //   }
      // }

      // if (updateLoanDTO?.signed_liquidate_agreement && loan?.signed_liquidate_agreement) {
      //   if (customer?.email) {
      //     const data = {
      //       customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
      //     }
      //     await this.emailTemplateService.sendEmail(customer?.email, "liquidity_closure", db_name, data);
      //   }
      // }

      return {
        _id: loan?.id,
        liquidate_number: loan?.liquidate_number,
        customer_id: customer?.id,
        customer_full_name: `${customer.first_name} ${customer.last_name}`,
        customer_email: customer?.email || '',
        customer_mobile_number: `${customer.country_code} ${customer.phone}`,
        profile_image: customer?.profile_image || '',
        signed_agreements: loan?.signed_agreements,
        agreement_uploaded_date: loan?.signed_agreements[0]?.created_date,
        signed_fullfillment_agreement: loan?.signed_fullfillment_agreement,
        signed_liquidate_agreement: loan?.signed_liquidate_agreement,
      };
    } catch (error) {
      throw error;
    }
  }

  async getLoanList(
    db_name: string,
    customer_id: string,
    i18n: I18nContext,
    loan_id?: string,
  ): Promise<any[]> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    let loanQuery: any = { verifier_id: { $ne: null } };
    if (loan_id) {
      loanQuery._id = loan_id;
    } else if (customer_id) {
      loanQuery.customer_id = customer_id;
    }

    const loans = loan_id
      ? await this.loanModel.find(loanQuery)
      : await this.loanModel.find(loanQuery);

    if (!loans || loans.length === 0) {
      throw new BadRequestException(i18n.t(`lang.loan.loan_not_found`));
    }

    const customerId = loan_id ? loans[0].customer_id.toString() : customer_id;
    const customer = await this.customerService.getUserProfile(
      customerId,
      db_name,
    );

    const loanList = await Promise.all(
      loans.map(async (loan) => {
        const childLoan = await this.loanModel
          .findOne({ parent_loan_id: loan.id, is_verified: true })
          .exec();
        const next_emi_date =
          await this.loanInstallmentService.getNextPendingEmi(db_name, loan.id);
        await this.loanInstallmentService.penaltyCalculate(
          loan.id,
          db_name,
          i18n,
        );
        const installments = await this.loanInstallmentService.getInstallments(
          db_name,
          loan.id,
        );
        const inventry_details = await this.goldItemService.getGoldItem(
          loan?.valuation_id.toString(),
          db_name,
          i18n,
        );
        const agreements = loan?.signed_agreements || [];

        if (loan?.signed_fullfillment_agreement) {
          agreements.push({
            agreement_type: loan.signed_fullfillment_agreement.agreement_type,
            agreement_url: loan.signed_fullfillment_agreement.agreement_url,
            created_date: loan.signed_fullfillment_agreement.created_date,
          });
        }

        if (loan?.signed_liquidate_agreement) {
          agreements.push({
            agreement_type: loan.signed_liquidate_agreement.agreement_type,
            agreement_url: loan.signed_liquidate_agreement.agreement_url,
            created_date: loan.signed_liquidate_agreement.created_date,
          });
        }

        const formattedInstallments = await Promise.all(
          installments.map(async (installment) => {
            const transaction_id =
              await this.loanPaymentTransactionService.findEmiTransaction(
                installment?.id,
                db_name,
              );
            let formattedPenaltyWeive;
            if (installment.waiver_type === 'percentage') {
              formattedPenaltyWeive = `${installment.waiver_value}%`;
            } else {
              formattedPenaltyWeive = await this.goldLoanService.formatCurrency(
                installment.waiver_value,
                i18n,
              );
            }
            return {
              emi_id: installment.id,
              emi_number: installment.emi_number,
              emi_amount: await this.goldLoanService.formatCurrency(
                installment.emi_amount,
                i18n,
              ),
              emi_status: installment.emi_status,
              emi_payment_date: installment.emi_payment_date,
              transaction_id: transaction_id,
              penalty: await this.goldLoanService.formatCurrency(
                installment.penalty,
                i18n,
              ),
              total_due: await this.goldLoanService.formatCurrency(
                installment.total_due,
                i18n,
              ),
              weiver_type: installment.waiver_type || '',
              penalty_weive: formattedPenaltyWeive,
              net_penalty: await this.goldLoanService.formatCurrency(
                installment.net_penalty,
                i18n,
              ),
              weiver_amount: await this.goldLoanService.formatCurrency(
                installment.waiver_amount,
                i18n,
              ),
            };
          }),
        );
        const store_data = await this.storeService.getStoreDetails(
          loan?.branch_id,
          db_name,
        );

        const paidEmis = installments.filter(
          (installment) => installment.emi_status === 'paid',
        );
        const pendingEmis = installments.filter(
          (installment) => installment.emi_status !== 'paid',
        );
        const pendingEmiAmount = pendingEmis.reduce(
          (acc, installment) => acc + installment.emi_amount,
          0,
        );

        const penalty = installments.reduce(
          (acc, installment) => acc + installment?.penalty || 0,
          0,
        );
        const weiver = installments.reduce(
          (acc, installment) => acc + installment?.waiver_value || 0,
          0,
        );

        const installmentWithPenalty = pendingEmis.filter(
          (installment) => installment.penalty !== 0,
        );
        const sortedEmis = installmentWithPenalty.sort(
          (a, b) =>
            new Date(b.emi_payment_date).getTime() -
            new Date(a.emi_payment_date).getTime(),
        );
        const lastEmiPenalty = sortedEmis[0] || null;
        const total_buyback_penalty = lastEmiPenalty?.penalty || 0;
        const total_weiver = installmentWithPenalty.reduce(
          (acc, installment) => acc + installment.waiver_value,
          0,
        );

        const transactions =
          await this.loanPaymentTransactionService.getLoanTransactions(
            loan?.id,
            db_name,
            i18n,
          );

        const top_up = loan?.top_up_requested == 1 ? loan?.top_up : 0;
        return {
          liquidity_id: loan.id,
          store_id: loan?.branch_id || '',
          parent_liquidity_id: loan?.parent_loan_id || '',
          top_up: await this.goldLoanService.formatCurrency(
            top_up ? top_up : 0,
            i18n,
          ),
          balance_to_paid_by_customer:
            await this.goldLoanService.formatCurrency(
              loan?.balance_to_paid_by_customer || 0,
              i18n,
            ),
          liquidate_number: loan.liquidate_number,
          child_liquidity_id: childLoan?.id || '',
          child_liquidity_number: childLoan?.liquidate_number || '',
          gold_piece_value: await this.goldLoanService.formatCurrency(
            loan.gold_piece_value,
            i18n,
          ),
          cash_to_customer: await this.goldLoanService.formatCurrency(
            loan.cash_to_customer,
            i18n,
          ),
          available_liquidity_to_customer:
            await this.goldLoanService.formatCurrency(
              loan.available_liquidity_to_customer,
              i18n,
            ),
          liquidity_status: loan.loan_status,
          liquidity_transaction_date: loan?.transaction_date,
          tenure_in_months: `${loan.tenure_in_months} ${i18n.t('lang.gold_loan.months')}`,
          gold_weight: loan.gold_weight,
          gold_karatage: loan.gold_purity_entered_per_1000,
          margin_rate: loan.margin_rate,
          total_margin: await this.goldLoanService.formatCurrency(
            loan.margin,
            i18n,
          ),
          upcoming_installment_date: next_emi_date,
          installments: formattedInstallments,
          transactions: transactions,
          total_buyback_penalty: penalty
            ? await this.goldLoanService.formatCurrency(penalty - weiver, i18n)
            : await this.goldLoanService.formatCurrency(0, i18n),
          total_liqquidate_penalty: penalty
            ? await this.goldLoanService.formatCurrency(penalty - weiver, i18n)
            : await this.goldLoanService.formatCurrency(0, i18n),
          customer_total_paid_amount: await this.goldLoanService.formatCurrency(
            paidEmis.reduce(
              (acc, installment) => acc + installment.emi_amount,
              0,
            ),
            i18n,
          ),
          buyback_valuation_amount: await this.goldLoanService.formatCurrency(
            loan.balance_to_complete_buyback_back,
            i18n,
          ),
          total_buyback_amount: await this.goldLoanService.formatCurrency(
            loan.balance_to_complete_buyback_back +
              pendingEmiAmount +
              (total_buyback_penalty ? total_buyback_penalty : 0) -
              total_weiver,
            i18n,
          ),
          buyback_description:
            'Total buyback amount is the combined total of the Buyback price and any pending Installments.',
          liquidation_cost_rate: loan?.liquidation_cost_rate || 0,
          liquidation_costs: await this.goldLoanService.formatCurrency(
            loan?.liquidation_costs || 0,
            i18n,
          ),
          new_gold_liquidation_value: await this.goldLoanService.formatCurrency(
            loan?.new_gold_liquidation_value || 0,
            i18n,
          ),
          funds_due_to_customer: await this.goldLoanService.formatCurrency(
            loan?.funds_due_to_customer || 0,
            i18n,
          ),
          total_liquidation_amount: await this.goldLoanService.formatCurrency(
            loan?.funds_due_to_customer -
                pendingEmiAmount -
                (total_buyback_penalty ? total_buyback_penalty : 0) -
                total_weiver,
            i18n,
          ),
          liquidation_description:
            'Total Liquidation amount the combined total of the Liquidate price and any pending Installments.',
          customer: {
            id: customer.id,
            full_name: `${customer.first_name} ${customer.last_name}`,
            email: customer.email,
            phone: `${customer.country_code} ${customer.phone}`,
            profile_image: customer?.profile_image || '',
          },
          store_data: store_data ? store_data : {},
          agreements: agreements,
          gold_items: inventry_details,
        };
      }),
    );
    return loanList.sort((a, b) => {
      if (a.upcoming_installment_date === null) return 1;
      if (b.upcoming_installment_date === null) return -1;
      return (
        b.upcoming_installment_date.getTime() -
        a.upcoming_installment_date.getTime()
      );
    });
  }

  async getAllApprovedLoanList(
    db_name: string,
    store_id: string,
    i18n: I18nContext,
  ): Promise<any[]> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    const loans = await this.loanModel
      .find({
        verifier_id: { $ne: null },
        is_verified: true,
        // ...(store_id ? { verification_office_id: store_id } : {}),
      })
      .sort({ transaction_date: -1 });
    if (loans.length === 0) {
      throw new BadRequestException(i18n.t(`lang.loan.loan_not_found`));
    }
    return await Promise.all(
      loans.map(async (loan) => {
        const next_emi_date =
          await this.loanInstallmentService.getNextPendingEmi(db_name, loan.id);
        const installments = await this.loanInstallmentService.getInstallments(
          db_name,
          loan.id,
        );
        const customer = await this.customerService.getUserProfile(
          (loan?.customer_id).toString(),
          db_name,
        );

        const formattedInstallments = await Promise.all(
          installments.map(async (installment) => {
            const transaction_id =
              await this.loanPaymentTransactionService.findEmiTransaction(
                installment?.id,
                db_name,
              );
            let formattedPenaltyWeive: string;
            if (installment.waiver_type === 'percentage') {
              formattedPenaltyWeive = `${installment.waiver_value}%`;
            } else {
              formattedPenaltyWeive = await this.goldLoanService.formatCurrency(
                installment.waiver_value,
                i18n,
              );
            }
            return {
              emi_id: installment.id,
              emi_number: installment.emi_number,
              emi_amount: await this.goldLoanService.formatCurrency(
                installment.emi_amount,
                i18n,
              ),
              emi_status: installment.emi_status,
              emi_payment_date: installment.emi_payment_date,
              transaction_id: transaction_id,
              penalty: await this.goldLoanService.formatCurrency(
                installment.penalty,
                i18n,
              ),
              total_due: await this.goldLoanService.formatCurrency(
                installment.total_due,
                i18n,
              ),
              weiver_type: installment.waiver_type || '',
              penalty_weive: formattedPenaltyWeive,
              net_penalty: await this.goldLoanService.formatCurrency(
                installment.net_penalty,
                i18n,
              ),
              weiver_amount: await this.goldLoanService.formatCurrency(
                installment.waiver_amount,
                i18n,
              ),
            };
          }),
        );

        const store_data = await this.storeService.getStoreDetails(
          loan?.verification_office_id,
          db_name,
        );
        const pendingEmis = installments.filter(
          (installment) => installment.emi_status == 'pending',
        );
        const pendingEmiAmount = pendingEmis.reduce(
          (acc, installment) => acc + installment.emi_amount,
          0,
        );

        const transactions =
          await this.loanPaymentTransactionService.getLoanTransactions(
            loan?.id,
            db_name,
            i18n,
          );

        return {
          liquidity_id: loan.id,
          store_id: loan?.branch_id || '',
          liquidate_number: loan.liquidate_number,
          gold_piece_value: await this.goldLoanService.formatCurrency(
            loan.gold_piece_value,
            i18n,
          ),
          liquidity_status: loan.loan_status,
          tenure_in_months: `${loan.tenure_in_months} ${i18n.t('lang.gold_loan.months')}`,
          gold_weight: loan.gold_weight,
          gold_karatage: loan.gold_purity_entered_per_1000,
          margin_rate: loan.margin_rate,
          total_margin: await this.goldLoanService.formatCurrency(
            loan.margin,
            i18n,
          ),
          cash_to_customer: await this.goldLoanService.formatCurrency(
            loan.cash_to_customer,
            i18n,
          ),
          available_liquidity_to_customer:
            await this.goldLoanService.formatCurrency(
              loan?.available_liquidity_to_customer,
              i18n,
            ),
          transaction_date: loan?.transaction_date,
          upcoming_installment_date: next_emi_date,
          installments: formattedInstallments,
          transactions: transactions,
          total_buyback_penalty: '-',
          total_liqquidate_penalty: '-',
          buyback_valuation_amount: await this.goldLoanService.formatCurrency(
            loan.balance_to_complete_buyback_back,
            i18n,
          ),
          total_buyback_amount: await this.goldLoanService.formatCurrency(
            loan.balance_to_complete_buyback_back + pendingEmiAmount,
            i18n,
          ),
          buyback_description:
            'Total buyback amount is the combined total of the Buyback price and any pending Installments.',
          liquidation_cost_rate: loan?.liquidation_cost_rate || 0,
          liquidation_costs: await this.goldLoanService.formatCurrency(
            loan?.liquidation_costs || 0,
            i18n,
          ),
          new_gold_liquidation_value: await this.goldLoanService.formatCurrency(
            loan?.new_gold_liquidation_value || 0,
            i18n,
          ),
          funds_due_to_customer: await this.goldLoanService.formatCurrency(
            loan?.funds_due_to_customer || 0,
            i18n,
          ),
          total_liquidation_amount: await this.goldLoanService.formatCurrency(
            loan.available_liquidity_to_customer + pendingEmiAmount,
            i18n,
          ),
          liquidation_description:
            'Total Liquidation amount the combined total of the Liquidate price and any pending Installments.',
          customer: {
            id: customer.id,
            full_name: `${customer.first_name} ${customer.last_name}`,
            email: customer.email,
            phone: `${customer.country_code} ${customer.phone}`,
            profile_image: customer?.profile_image || '',
          },
          store_data,
        };
      }),
    );
  }

  async getExtendLoanDetails(
    db_name: string,
    customer_id: string,
    getLoandetails: GetLoanDTO,
    tenure?: number,
    topup_request?: number,
    i18n?: I18nContext,
  ): Promise<any> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    const loan = await this.loanModel.findOne({
      _id: getLoandetails?.loan_id,
    });
    let tenure_in_months: number;
    let topup: number;
    if (tenure) {
      tenure_in_months = tenure;
    } else {
      tenure_in_months = loan?.tenure_in_months;
    }

    if (topup_request) {
      topup = topup_request;
    } else {
      topup = 1;
    }
    const extendDetails = await this.goldLoanService.goldLoanRenewal(
      customer_id,
      {
        remaining_balance: loan?.balance_to_complete_buyback_back,
        customer_request_topup: topup,
        weight: loan?.gold_weight,
        goldPurityEnteredPer1000: loan?.gold_purity_entered_per_1000,
        buyBackTermInMonths: tenure_in_months,
      },
      db_name,
      i18n,
    );
    if (!loan) {
      throw new BadRequestException(i18n.t(`lang.loan.loan_not_found`));
    }
    const installments = await this.loanInstallmentService.getInstallments(
      db_name,
      loan.id,
    );
    return {
      liquidity_id: loan?.id,
      liquidate_number: loan?.liquidate_number,
      gold_piece_value: await this.goldLoanService.formatCurrency(
        loan?.gold_piece_value,
        i18n,
      ),
      liquidity_status: loan?.loan_status,
      gold_weight: loan?.gold_weight,
      gold_karatage: loan?.gold_purity_entered_per_1000,
      tenure_in_months: `${loan?.tenure_in_months} ${i18n.t('lang.gold_loan.months')}`,
      installment_amount: installments[0]?.emi_amount,
      existing_liquidity_details: {
        gold_piece_value: await this.goldLoanService.formatCurrency(
          loan?.gold_piece_value,
          i18n,
        ),
        admin_purchase_fees: await this.goldLoanService.formatCurrency(
          loan?.admin_purchase_fees,
          i18n,
        ),
        total_margin: await this.goldLoanService.formatCurrency(
          loan?.margin,
          i18n,
        ),
        installment_value: await this.goldLoanService.formatCurrency(
          loan?.margin / loan.tenure_in_months,
          i18n,
        ),
        margin_rate: loan?.margin_rate,
        tenure_in_months: `${loan?.tenure_in_months} ${i18n.t('lang.gold_loan.months')}`,
        buyback_amount: await this.goldLoanService.formatCurrency(
          loan?.balance_to_complete_buyback_back,
          i18n,
        ),
        liquidate_amount: await this.goldLoanService.formatCurrency(
          loan?.available_liquidity_to_customer,
          i18n,
        ),
        net_purchase_price_from_customer:
          await this.goldLoanService.formatCurrency(
            loan?.net_purchase_price_from_customer,
            i18n,
          ),
        advance_payment_by_customer: await this.goldLoanService.formatCurrency(
          loan?.advance_payment_by_customer,
          i18n,
        ),
        karatage_price_per_gram: await this.goldLoanService.formatCurrency(
          loan?.karatage_price_per_gram,
          i18n,
        ),
        cash_to_customer: await this.goldLoanService.formatCurrency(
          loan?.cash_to_customer,
          i18n,
        ),
        available_liquidity_to_customer:
          await this.goldLoanService.formatCurrency(
            loan?.available_liquidity_to_customer,
            i18n,
          ),
      },
      extended_liquidity_details: {
        customer_remaining_balance: await this.goldLoanService.formatCurrency(
          loan?.balance_to_complete_buyback_back,
          i18n,
        ),
        gold_price_24_karate: await this.goldLoanService.formatCurrency(
          extendDetails?.gold_price_24_karate,
          i18n,
        ),
        new_gold_value: await this.goldLoanService.formatCurrency(
          extendDetails?.goldPieceValue,
          i18n,
        ),
        top_up: await this.goldLoanService.formatCurrency(
          extendDetails?.availableTopUpValue,
          i18n,
        ),
        balace_to_paid_by_customer: await this.goldLoanService.formatCurrency(
          extendDetails?.balaceToPaidByCustomer,
          i18n,
        ),
        admin_fee_renewal: await this.goldLoanService.formatCurrency(
          extendDetails?.adminFeesRenewal,
          i18n,
        ),
        tenure_in_months: `${extendDetails?.buyBackTermInMonths} ${i18n.t('lang.gold_loan.months')}`,
        total_margin: await this.goldLoanService.formatCurrency(
          extendDetails?.margin,
          i18n,
        ),
        installment_value: await this.goldLoanService.formatCurrency(
          extendDetails?.installmentValue,
          i18n,
        ),
        buyback_amount: await this.goldLoanService.formatCurrency(
          extendDetails?.balanceToCompleteSellback,
          i18n,
        ),
        liquidate_amount: await this.goldLoanService.formatCurrency(
          extendDetails?.balanceToCompleteSellback,
          i18n,
        ),
        karatage_price_per_gram: await this.goldLoanService.formatCurrency(
          extendDetails?.karatagePricePerGram,
          i18n,
        ),
        net_purchase_price_from_customer:
          await this.goldLoanService.formatCurrency(
            extendDetails?.netPurChasePriceFromCustomer,
            i18n,
          ),
        advance_payment_by_customer: await this.goldLoanService.formatCurrency(
          extendDetails?.advancePaymentByCustomer,
          i18n,
        ),
        customer_new_balance: await this.goldLoanService.formatCurrency(
          extendDetails?.customerNewBalance,
          i18n,
        ),
        transfer_amount: await this.goldLoanService.formatCurrency(
          topup == 1 ? extendDetails?.availableTopUpValue : 0,
          i18n,
        ),
        liquidation_cost_rate: extendDetails?.liquidation_cost_rate,
        liquidation_costs: await this.goldLoanService.formatCurrency(
          extendDetails?.liquidation_costs,
          i18n,
        ),
        new_gold_liquidation_value: await this.goldLoanService.formatCurrency(
          extendDetails?.new_gold_liquidation_value,
          i18n,
        ),
        funds_due_to_customer: await this.goldLoanService.formatCurrency(
          extendDetails?.funds_due_to_customer,
          i18n,
        ),
      },
      installments: installments,
    };
  }

  async getPendingLoandetails(
    db_name: string,
    user_id: string,
    store_id: string,
    i18n: I18nContext,
  ): Promise<any[]> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);

    const treasurer = await this.authService.getUserPermissions(
      user_id,
      'transactionProcessingSystem.Below25kApprove',
      db_name,
      i18n,
    );
    const finance_director = await this.authService.getUserPermissions(
      user_id,
      'transactionProcessingSystem.Above25kApprove',
      db_name,
      i18n,
    );

    let matchStage: any = {
      is_verified: false,
      signed_agreements: { $elemMatch: { $exists: true } },
      ...(store_id ? { branch_id: new mongoose.Types.ObjectId(store_id) } : {}),
    };

    if (treasurer && finance_director) {
      matchStage.cash_to_customer = { $gte: 0 };
    } else if (treasurer) {
      matchStage.cash_to_customer = { $lte: 25000 };
    } else if (finance_director) {
      matchStage.cash_to_customer = { $gte: 25000 };
    } else {
      throw new BadRequestException(
        i18n.t('lang.auth.tanant.no_resource_access'),
      );
    }

    const query: PipelineStage[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'customer',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer',
          pipeline: [
            {
              $project: {
                _id: 1,
                full_name: { $concat: ['$first_name', ' ', '$last_name'] },
                profile_image: { $ifNull: ['$profile_image', ''] },
                email: 1,
                phone: { $concat: ['$country_code', ' ', '$phone'] },
              },
            },
          ],
        },
      },
      { $unwind: '$customer' },
      {
        $lookup: {
          from: 'golditems',
          localField: 'valuation_id',
          foreignField: 'valuation_id',
          as: 'gold_items',
        },
      },
      { $sort: { transaction_date: -1 } },
    ];

    const loans = await this.loanModel.aggregate(query).exec();
    if (loans.length === 0) {
      return [];
    }

    return await Promise.all(
      loans.map(async (loan) => {
        const installments = await this.loanInstallmentService.getInstallments(
          db_name,
          loan._id.toString(),
        );
        const cash_to_customer = loan?.parent_loan_id
          ? loan?.top_up_requested === 1
            ? loan?.top_up_value
            : loan?.top_up_requested === 0
              ? 0
              : loan?.available_liquidity_to_customer
          : loan?.available_liquidity_to_customer;
        return {
          _id: loan?._id,
          liquidity_number: loan?.liquidate_number,
          parent_liquidity_id: loan?.parent_loan_id || '',
          top_up_requested: loan?.top_up_requested || '',
          top_up_value: await this.goldLoanService.formatCurrency(
            loan?.top_up_value || 0,
            i18n,
          ),
          balance_to_paid_by_customer:
            await this.goldLoanService.formatCurrency(
              loan?.balace_to_paid_by_customer || 0,
              i18n,
            ),
          customer_id: loan?.customer_id,
          valuation_id: loan?.valuation_id,
          verifier_id: loan?.verifier_id,
          liquidity_status: loan?.loan_status,
          gold_weight: loan?.gold_weight,
          installment: await this.goldLoanService.formatCurrency(
            installments[0]?.emi_amount || 0,
            i18n,
          ),
          gold_purity_entered_per_1000: loan?.gold_purity_entered_per_1000,
          customer_cash_needs: await this.goldLoanService.formatCurrency(
            loan.customer_cash_needs,
            i18n,
          ),
          transfer_amount: await this.goldLoanService.formatCurrency(
            cash_to_customer,
            i18n,
          ),
          cash_to_customer: await this.goldLoanService.formatCurrency(
            loan?.cash_to_customer,
            i18n,
          ),
          available_liquidity_to_customer:
            await this.goldLoanService.formatCurrency(
              loan?.available_liquidity_to_customer,
              i18n,
            ),
          gold_piece_value: await this.goldLoanService.formatCurrency(
            loan.gold_piece_value,
            i18n,
          ),
          admin_fee: await this.goldLoanService.formatCurrency(
            loan.admin_purchase_fees,
            i18n,
          ),
          tenure: `${loan.tenure_in_months} ${i18n.t('lang.gold_loan.months')}`,
          buyback_amount: await this.goldLoanService.formatCurrency(
            loan.balance_to_complete_buyback_back,
            i18n,
          ),
          net_liquidate_cash_after_fees:
            await this.goldLoanService.formatCurrency(
              loan.available_liquidity_to_customer,
              i18n,
            ),
          margin: await this.goldLoanService.formatCurrency(loan.margin, i18n),
          margin_rate: loan.margin_rate,
          gold_rate_at_valuation: await this.goldLoanService.formatCurrency(
            loan.gold_piece_value,
            i18n,
          ),
          karatage_price_per_gram: await this.goldLoanService.formatCurrency(
            loan?.karatage_price_per_gram,
            i18n,
          ),
          net_purchase_price_from_customer:
            await this.goldLoanService.formatCurrency(
              loan?.net_purchase_price_from_customer,
              i18n,
            ),
          advance_payment_by_customer:
            await this.goldLoanService.formatCurrency(
              loan?.advance_payment_by_customer,
              i18n,
            ),
          balance_to_complete_buyback_back:
            await this.goldLoanService.formatCurrency(
              loan?.balance_to_complete_buyback_back,
              i18n,
            ),
          transaction_date: loan?.transaction_date,
          liquidation_cost_rate: loan?.liquidation_cost_rate || 0,
          liquidation_costs: await this.goldLoanService.formatCurrency(
            loan?.liquidation_costs || 0,
            i18n,
          ),
          new_gold_liquidation_value: await this.goldLoanService.formatCurrency(
            loan?.new_gold_liquidation_value || 0,
            i18n,
          ),
          funds_due_to_customer: await this.goldLoanService.formatCurrency(
            loan?.funds_due_to_customer || 0,
            i18n,
          ),
          customer: {
            _id: loan?.customer._id,
            email: loan?.customer?.email,
            full_name: loan?.customer?.full_name,
            phone: loan?.customer?.phone,
            profile_image: loan?.customer?.profile_image,
          },
          gold_items: loan?.gold_items.map((item) => ({
            ...item,
            asset_images: item.asset_images,
          })),
          signed_agreements: loan?.signed_agreements,
        };
      }),
    );
  }

  async updateLoanCloserStatus(
    db_name: string,
    updateLoanStatus: UpdateLoanStatus,
    i18n: I18nContext,
  ): Promise<any> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);

    if (!mongoose.Types.ObjectId.isValid(updateLoanStatus.loan_id)) {
      throw new BadRequestException(i18n.t(`lang.loan.loan_not_found`));
    }

    const loan = await this.loanModel.findOneAndUpdate(
      { _id: updateLoanStatus.loan_id },
      {
        $set: {
          ...updateLoanStatus,
          ...(updateLoanStatus.loan_status === 'Buyback'
            ? { buy_back_date: date_moment() }
            : null),
          ...(updateLoanStatus.loan_status === 'Liquidate'
            ? { liquidate_date: date_moment() }
            : null),
        },
      },
      { new: true },
    );

    if (!loan) {
      throw new BadRequestException(i18n.t(`lang.loan.loan_not_found`));
    }
    return loan;
  }

  async findLoan(loan_id: string, db_name: string): Promise<Loan | any> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    const loan = await this.loanModel.findOne({ _id: loan_id }).exec();
    if (!loan) {
      return false;
    }
    return loan;
  }

  async loanCloserProcess(
    db_name: string,
    loanCloserDto: LoanCloserDto,
    i18n: I18nContext,
  ): Promise<any> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    const loan = await this.findLoan(loanCloserDto.loan_id, db_name);
    const aggrements = await this.agreementTemplateService.getAgreementTemplate(
      { loan_id: loan?.id, agreement_type: loanCloserDto.loan_closer_type },
      loanCloserDto.loan_closer_type == 2
        ? 'fullfillment_agreement'
        : 'liquidate_agreement',
      db_name,
      i18n,
    );
    const loan_closer_details = await this.getLoanList(
      db_name,
      loan?.customer_id,
      i18n,
      loan?._id,
    );
    if (loanCloserDto.loan_closer_type == 2) {
      await this.updateLoanStatus(
        db_name,
        {
          fullfillment_agreement: aggrements.agreement_url,
          loan_id: loan?.id,
        },
        i18n,
      );
      const customer = await this.customerService.getUserProfile(
        loan?.customer_id.toString(),
        db_name,
      );
      if (customer) {
        this.customerNotificationService.sendPushNotification(
          (loan?.customer_id).toString(),
          'buyback_process_initiated',
          'notification',
          3,
          db_name,
        );
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
            amount_to_be_setteled: await formatCurrency(
              loan_closer_details[0]?.buyback_valuation_amount,
              i18n,
            ),
            remaining_balace: await formatCurrency(
              loan_closer_details[0]?.available_liquidity_to_customer,
              i18n,
            ),
            customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
            support_phone: store_owner_details?.mobile_number || '',
            support_email: store_owner_details?.email || '',
          };
          await this.emailTemplateService.sendEmail(
            customer?.email,
            'buyback_process_initiated',
            db_name,
            data,
          );
        }
      }
    } else if (loanCloserDto.loan_closer_type == 3) {
      await this.updateLoanStatus(
        db_name,
        {
          liquidate_agreement: aggrements.agreement_url,
          loan_id: loan?.id,
        },
        i18n,
      );
      const customer = await this.customerService.getUserProfile(
        loan?.customer_id.toString(),
        db_name,
      );
      if (customer) {
        this.customerNotificationService.sendPushNotification(
          (loan?.customer_id).toString(),
          'liquidation_process_initiated',
          'notification',
          3,
          db_name,
        );
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
            amount_to_be_setteled: await formatCurrency(
              loan_closer_details[0]?.total_liquidation_amount,
              i18n,
            ),
            remaining_balace: await formatCurrency(
              loan_closer_details[0]?.available_liquidity_to_customer,
              i18n,
            ),
            customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`,
            support_phone: store_owner_details?.mobile_number || '',
            support_email: store_owner_details?.email || '',
          };
          await this.emailTemplateService.sendEmail(
            customer?.email,
            'liquidation_process',
            db_name,
            data,
          );
        }
      }
    }

    return {
      liquidity_id: loan?.id,
      liquidity_number: loan?.liquidate_number,
      valuation_id: loan?.valuation_id,
      customer_id: loan?.customer_id,
      is_verified: loan?.is_verified,
      agreement_type: loanCloserDto.loan_closer_type,
      agreements: aggrements.agreements_details,
      agreement_pdf_url: aggrements.agreement_url,
    };
  }

  async findCustomerActiveLoan(
    customer_id: string,
    db_name: string,
  ): Promise<Loan | any> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    const loan = await this.loanModel
      .findOne({ customer_id: customer_id, loan_status: 'Active' })
      .exec();
    if (!loan) {
      return false;
    }
    return loan;
  }
}

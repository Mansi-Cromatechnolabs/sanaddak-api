import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  Search,
} from '@nestjs/common';
import mongoose, { Model, Types } from 'mongoose';
import { PriceConfig, PriceConfigSchema } from './schema/price_config.schema';
import { AssetDetails, RenewalDetails } from './dto/price_config.dto';
import { add_days, date_moment } from 'src/utils/date.util';
import {
  InitialValuationDTO,
  CustomerIniatialLoanEstimationDTO,
  KycVerificationDto,
  CustomerKycVerificationDto,
  KycApprovedDisapprovedStatusDto,
} from './dto/customer_loan_estimation.dto';
import {
  UserKycDetails,
  UserKycDetailsSchema,
} from './schema/kyc_details.schema';
import { I18nContext } from 'nestjs-i18n';
import { AppointmentService } from '../appointment/services/appointment.service';
import { AdminConfigService } from './price_config.service';
import { documentUpload } from 'src/utils/file.util';
import axios from 'axios';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { CustomerService } from 'src/customer/service/customer.service';
import {
  InitialValuations,
  InitialValuationSchema,
} from './schema/customer_loan_estimation.schema';
import { Tag, TagSchema } from './schema/tag.schema';
import { AgreementTemplateService } from '../agreement_template/agreement_template.service';
import { _404 } from 'src/utils/http-code.util';
import { Customer, CustomerSchema } from 'src/customer/schema/customer.schema';
import { StoreAvailabilityService } from '../appointment/services/store_availability.service';
import { ApplicationStatusService } from '../appointment/services/application_status.service';
import { AuthService } from '../auth/auth.service';
import { LoanService } from '../loan/service/loan.service';
import { NotificationTemplateService } from '../notification_template/notification_template.service';
import { CustomerNotificationService } from '../notification/notification.service';

@Injectable()
export class GoldLoanService {
  public loanEstimationConfigModel: Model<any>;
  public initialValuationModel: Model<any>;
  public userKycDetails: Model<any>;
  public tagModel: Model<any>;
  public customerModel: Model<any>;

  constructor(
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => AdminConfigService))
    private readonly adminConfigService: AdminConfigService,
    @Inject(forwardRef(() => AppointmentService))
    private readonly appointmentService: AppointmentService,
    @Inject(forwardRef(() => AgreementTemplateService))
    private readonly agreementTemplateService: AgreementTemplateService,
    @Inject(forwardRef(() => StoreAvailabilityService))
    private readonly storeAvailabilityService: StoreAvailabilityService,
    @Inject(forwardRef(() => ApplicationStatusService))
    private readonly applicationStatusService: ApplicationStatusService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => LoanService))
    private readonly loanService: LoanService,
    @Inject(forwardRef(() => NotificationTemplateService))
    private readonly notificationTemplateService: NotificationTemplateService,
    @Inject(forwardRef(() => CustomerNotificationService))
    private readonly customerNotificationService: CustomerNotificationService,
  ) {}

  async getDefaultPriceConfig(db_name: string): Promise<PriceConfig> {
    this.loanEstimationConfigModel = setTanantConnection(
      db_name,
      PriceConfig.name,
      PriceConfigSchema,
    );
    this.tagModel = setTanantConnection(db_name, Tag.name, TagSchema);

    const tag = await this.tagModel.findOne({ name: 'Egypt' });
    const adminConfig = await this.loanEstimationConfigModel.findOne({
      tag_id: tag?.['id'],
    });
    return adminConfig;
  }

  async addCustomerGoldValuation(
    valuation_id: string,
    initialValuationDTO: InitialValuationDTO,
    db_name,
    i18n: I18nContext,
  ): Promise<any> {
    this.initialValuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );
    let InitialValuation;
    if (valuation_id) {
      const user = await this.customerService.getUserProfile(
        initialValuationDTO.customer_id,
        db_name,
      );
      if (!user) {
        throw new BadRequestException({
          message: i18n.t(`lang.auth.invalid_user`),
          data: {},
        });
      }
      delete initialValuationDTO.loan_estimation_calculated_date;
      InitialValuation = await this.initialValuationModel.findOneAndUpdate(
        {
          _id: valuation_id,
          customer_id: initialValuationDTO.customer_id,
        },
        {
          $set: {
            ...initialValuationDTO,
            loan_estimation_modify_date: date_moment(),
          },
        },
        { new: true },
      );
    } else {
      let valuationNumber: string;
      let existingValuation: string;

      do {
        valuationNumber = `VA${new Date().getTime()}`;
        existingValuation = await this.initialValuationModel
          .findOne({
            valuation_number: valuationNumber,
          })
          .exec();
      } while (existingValuation);
      initialValuationDTO.valuation_number = valuationNumber;
      InitialValuation = new this.initialValuationModel(initialValuationDTO);
    }

    if (InitialValuation) {
      await InitialValuation.save();
      return InitialValuation;
    } else {
      throw new BadRequestException({
        message: i18n.t(`lang.auth.invalid_user`),
        data: {},
      });
    }
  }

  async formatCurrency(value: number, i18n: I18nContext): Promise<string> {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: i18n.t(`lang.gold_loan.egp`),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(value);
  }

  async customerInitialGoldValuation(
    assetDetails: AssetDetails,
    user_id: string,
    i18n: I18nContext,
    db_name,
    appointment_id?: string,
    staff_id?: string,
    store_id?: string,
  ): Promise<any> {
    const customer = await this.customerService.getUserProfile(
      user_id,
      db_name,
    );

    const adminConfig = await this.adminConfigService.getCustomerPriceConfig(
      user_id,
      db_name,
      i18n,
    );
    const {
      gold_price_24_karate,
      reserve_rate,
      margin_rate,
      admin_fee_rate,
      admin_fee_rate_renewal,
      liquidation_cost,
    } = adminConfig;

    const initialValuationDetails = await this.goldLoanCalculate(
      assetDetails,
      user_id,
      db_name,
      i18n,
    );

    let goldValuation;
    if (customer) {
      goldValuation = await this.addCustomerGoldValuation(
        assetDetails.valuation_id,
        {
          customer_id: user_id,
          gold_rate_at_valuation: initialValuationDetails?.gold_piece_value,
          available_liquidity_to_customer: parseFloat(
            (initialValuationDetails?.available_liquidity_to_customer).toFixed(
              2,
            ),
          ),
          gold_weight: assetDetails.gold_weight,
          gold_purity_entered_per_1000:
            assetDetails.gold_purity_entered_per_1000,
          tenure_in_months: assetDetails.tenure_in_months,
          customer_cash_needs: assetDetails.customer_cash_needs,
          cash_to_customer: parseFloat(
            initialValuationDetails.cash_to_customer.toFixed(2),
          ),
          margin_rate: parseFloat(margin_rate.toFixed(2)),
          gold_price_24_karate: parseFloat(gold_price_24_karate.toFixed(2)),
          reserve_rate: parseFloat(reserve_rate.toFixed(2)),
          admin_fee_rate: parseFloat(admin_fee_rate.toFixed(2)),
          liquidation_cost: parseFloat(liquidation_cost.toFixed(2)),
          admin_fee_rate_renewal: parseFloat(admin_fee_rate_renewal.toFixed(2)),
          created_by: user_id,
          updated_by: user_id,
          specification: initialValuationDetails.specification,
          is_deleted: false,
          is_completed: false,
          loan_estimation_calculated_date: date_moment(),
          loan_estimation_modify_date: date_moment(),
          valuation_number: `VA${new Date().getTime()}`,
        },
        db_name,
        i18n,
      );

      const staff = await this.authService.getUserProfile(staff_id, db_name);

      if (staff) {
        await this.customerNotificationService.sendPushNotification(
          user_id,
          'gold_pieces_valuation',
          'notification',
          3,
          db_name,
        );
      }
    }
    //TODO: 1) User check valuation without sign in (Send push notification to customer)
    //   await this.customerNotificationService.sendPushNotification(
    //     user_id,
    //     'user_check_valuation',
    //     'notification',
    //     1,
    //     db_name,
    //   );

    if (appointment_id) {
      await this.appointmentService.updateAppointment(
        {
          appointment_id,
          valuation_id: goldValuation?.id,
        },
        db_name,
        i18n,
      );
      await this.applicationStatusService.updateApplicationStatus(
        {
          loan_id: null,
          valuation_id: (goldValuation?.id).toString(),
          application_status: 2,
          reason_for_rejection: null,
          status_update_date: null,
        },
        db_name,
        i18n,
      );
      await this.updateValuationStatus(
        (goldValuation?.id).toString(),
        2,
        db_name,
        store_id,
      );
    }

    return {
      valuation_id: goldValuation?.id || null,
      valuation_number: goldValuation?.valuation_number,
      customer_id: user_id ? user_id : null,
      gold_weight: assetDetails.gold_weight,
      gold_purity_entered_per_1000: assetDetails.gold_purity_entered_per_1000,
      gold_piece_value: await this.formatCurrency(
        initialValuationDetails.gold_piece_value,
        i18n,
      ),
      cash_to_customer: await this.formatCurrency(
        initialValuationDetails.cash_to_customer,
        i18n,
      ),
      available_liquidity_to_customer: await this.formatCurrency(
        initialValuationDetails.available_liquidity_to_customer,
        i18n,
      ),
      customer_cash_needs: await this.formatCurrency(
        initialValuationDetails.customer_cash_needs,
        i18n,
      ),
      transaction_date: goldValuation?.loan_estimation_calculated_date,
      admin_fee: await this.formatCurrency(
        initialValuationDetails.admin_purchase_fees,
        i18n,
      ),
      installment: await this.formatCurrency(
        initialValuationDetails.installment_value,
        i18n,
      ),
      tenure: `${assetDetails.tenure_in_months} ${i18n.t('lang.gold_loan.months')}`,
      buyback_amount: await this.formatCurrency(
        initialValuationDetails.balance_to_complete_buyback_back,
        i18n,
      ),
      net_liquidate_cash_after_fees: await this.formatCurrency(
        initialValuationDetails.available_liquidity_to_customer,
        i18n,
      ),
      margin: await this.formatCurrency(initialValuationDetails.margin, i18n),
      gold_rate_at_valuation: await this.formatCurrency(
        adminConfig.gold_price_24_karate,
        i18n,
      ),

      karatage_price_per_gram: await this.formatCurrency(
        initialValuationDetails?.karatage_price_per_gram,
        i18n,
      ),
      admin_purchase_fees: await this.formatCurrency(
        initialValuationDetails?.admin_purchase_fees,
        i18n,
      ),
      net_purchase_price_from_customer: await this.formatCurrency(
        initialValuationDetails?.net_purchase_price_from_customer,
        i18n,
      ),
      advance_payment_by_customer: await this.formatCurrency(
        initialValuationDetails?.advance_payment_by_customer,
        i18n,
      ),
      balance_to_complete_buyback_back: await this.formatCurrency(
        initialValuationDetails?.balance_to_complete_buyback_back,
        i18n,
      ),
      liquidation_cost: await this.formatCurrency(
        initialValuationDetails?.liquidation_costs,
        i18n,
      ),
      new_gold_liquidation_value: await this.formatCurrency(
        initialValuationDetails?.new_gold_liquidation_value,
        i18n,
      ),
      funds_due_to_customer: await this.formatCurrency(
        initialValuationDetails?.funds_due_to_customer,
        i18n,
      ),
      customer: {
        _id: customer?.id || '',
        email: customer?.email || '',
        full_name: customer
          ? `${customer?.first_name} ${customer?.last_name}`
          : '',
        phone: customer ? `${customer.country_code} ${customer.phone}` : '',
        profile_image: customer?.profile_image || '',
      },
    };
  }

  //initial gold loan calculation process
  async goldLoanCalculate(
    assetDetails: AssetDetails,
    user_id: string,
    db_name,
    i18n: I18nContext,
  ): Promise<any> {
    const {
      customer_cash_needs,
      gold_weight,
      gold_purity_entered_per_1000,
      tenure_in_months,
    } = assetDetails;
    const adminConfig = await this.adminConfigService.getCustomerPriceConfig(
      user_id,
      db_name,
      i18n,
    );
    const {
      gold_price_24_karate,
      reserve_rate,
      margin_rate,
      admin_fee_rate,
      liquidation_cost,
      min_admin_purchase_fees,
    } = adminConfig;

    const karatage_price_per_gram = await this.calculateKaratagePricePerGram(
      gold_purity_entered_per_1000,
      gold_price_24_karate,
    );
    const gold_piece_value = await this.calculateGoldPieceValue(
      karatage_price_per_gram,
      gold_weight,
    );
    const cash_to_customer = await this.calculateCashToCustomer(
      customer_cash_needs,
      reserve_rate,
      gold_piece_value,
    );
    const admin_purchase_fees = await this.calculateAdminPurchaseFees(
      gold_piece_value,
      admin_fee_rate,
    );
    const net_purchase_price_from_customer =
      await this.calculateNetPurchasePriceFromCustomer(
        gold_piece_value,
        admin_purchase_fees,
      );
    const margin = await this.calculateMargin(
      cash_to_customer,
      margin_rate,
      tenure_in_months,
    );
    const buy_back_price = await this.calculateBuyBackPrice(
      gold_piece_value,
      margin,
    );
    const advance_payment_by_customer =
      await this.calculateAdvancePaymentByCustomer(
        gold_piece_value,
        cash_to_customer,
      );
    const installment_value = await this.calculateInstallmentValue(
      margin,
      tenure_in_months,
    );
    const balance_to_complete_buyback_back =
      await this.calculateBalanceToCompleteBuyback(
        buy_back_price,
        advance_payment_by_customer,
        installment_value,
        tenure_in_months,
      );
    const available_liquidity_to_customer =
      await this.calculateAvailableLiquidityToCustomer(
        net_purchase_price_from_customer,
        advance_payment_by_customer,
      );
    const liquidation_costs = gold_piece_value * (liquidation_cost / 100);
    const new_gold_liquidation_value = gold_piece_value - liquidation_costs;
    const funds_due_to_customer =
      new_gold_liquidation_value - balance_to_complete_buyback_back;

    return {
      gold_piece_value: gold_piece_value,
      cash_to_customer: cash_to_customer,
      specification: assetDetails?.specification,
      installment_value: installment_value,
      balance_to_complete_buyback_back: balance_to_complete_buyback_back,
      available_liquidity_to_customer: available_liquidity_to_customer,
      margin: margin,
      karatage_price_per_gram,
      admin_purchase_fees:
        admin_purchase_fees < min_admin_purchase_fees
          ? min_admin_purchase_fees
          : admin_purchase_fees,
      net_purchase_price_from_customer,
      buy_back_price,
      advance_payment_by_customer,
      customer_cash_needs,
      admin_fee_rate: admin_purchase_fees,
      liquidation_cost_rate: liquidation_cost,
      liquidation_costs: liquidation_costs,
      new_gold_liquidation_value,
      funds_due_to_customer,
    };
  }

  async calculateKaratagePricePerGram(
    gold_purity_entered_per_1000: number,
    gold_price_24_karate: number,
  ): Promise<number> {
    const karatage_price_per_gram =
      (gold_purity_entered_per_1000 * gold_price_24_karate) / 24;
    return karatage_price_per_gram;
  }

  async calculateGoldPieceValue(
    karatage_price_per_gram: number,
    gold_weight: number,
  ): Promise<number> {
    const gold_piece_value = karatage_price_per_gram * gold_weight;
    return gold_piece_value;
  }

  async calculateCashToCustomer(
    customer_cash_needs: number,
    reserve_rate: number,
    gold_piece_value: number,
  ): Promise<number> {
    if (
      customer_cash_needs > (1 - reserve_rate / 100) * gold_piece_value &&
      (1 - reserve_rate / 100) * gold_piece_value &&
      customer_cash_needs
    ) {
      const cash_to_customer = (1 - reserve_rate / 100) * gold_piece_value;
      return cash_to_customer;
    } else {
      return customer_cash_needs;
    }
  }

  async calculateAdminPurchaseFees(
    gold_piece_value: number,
    admin_fee_rate: number,
  ): Promise<number> {
    const admin_purchase_fees = (gold_piece_value * admin_fee_rate) / 100;
    return admin_purchase_fees;
  }

  async calculateNetPurchasePriceFromCustomer(
    gold_piece_value: number,
    admin_purchase_fees: number,
  ): Promise<number> {
    const net_purchase_price_from_customer =
      gold_piece_value - admin_purchase_fees;
    return net_purchase_price_from_customer;
  }

  async calculateMargin(
    cash_to_customer: number,
    margin_rate: number,
    buy_back_term_in_month: number,
  ): Promise<any> {
    const margin =
      cash_to_customer * (margin_rate / 100) * buy_back_term_in_month;
    return margin;
  }

  async calculateBuyBackPrice(
    gold_piece_value: number,
    margin: number,
  ): Promise<number> {
    const buy_back_price = gold_piece_value + margin;
    return buy_back_price;
  }

  async calculateAdvancePaymentByCustomer(
    gold_piece_value: number,
    cash_to_customer: number,
  ): Promise<number> {
    const advance_payment_by_customer = gold_piece_value - cash_to_customer;
    return advance_payment_by_customer;
  }

  async calculateInstallmentValue(
    margin: number,
    buy_back_term_in_month: number,
  ): Promise<number> {
    const installment_value = margin / buy_back_term_in_month;
    return installment_value;
  }

  async calculateBalanceToCompleteBuyback(
    buy_back_price: number,
    advance_payment_by_customer: number,
    installment_value: number,
    buy_back_term_in_month: number,
  ): Promise<number> {
    const balance_to_complete_buyback_back =
      buy_back_price -
      advance_payment_by_customer -
      installment_value * buy_back_term_in_month;
    return balance_to_complete_buyback_back;
  }

  async calculateAvailableLiquidityToCustomer(
    net_purchase_price_from_customer: number,
    advance_payment_by_customer: number,
  ): Promise<number> {
    const available_liquidity_to_customer =
      net_purchase_price_from_customer - advance_payment_by_customer;
    return available_liquidity_to_customer;
  }

  //renewal gold loan calculation process
  async goldLoanRenewal(
    customer_id: string,
    renewalDetails: RenewalDetails,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.loanEstimationConfigModel = setTanantConnection(
      db_name,
      PriceConfig.name,
      PriceConfigSchema,
    );
    const adminConfig = await this.adminConfigService.getCustomerPriceConfig(
      customer_id,
      db_name,
      i18n,
    );

    const karatagePricePerGram = await this.calculateKaratagePricePerGram(
      renewalDetails.goldPurityEnteredPer1000,
      adminConfig.gold_price_24_karate,
    );
    const goldPieceValue = await this.calculateGoldPieceValue(
      karatagePricePerGram,
      renewalDetails.weight,
    );
    const adminFeesRenewal = await this.calculateAdminFeesRenewal(
      goldPieceValue,
      adminConfig.admin_fee_rate_renewal,
    );
    const netPurChasePriceFromCustomer =
      await this.calculateNetPurchasePriceFromCustomer(
        goldPieceValue,
        adminFeesRenewal,
      );
    const availableTopUpValue = await this.calculateTopUpValue(
      renewalDetails.remaining_balance,
      goldPieceValue,
      adminConfig.reserve_rate,
      adminFeesRenewal,
    );
    const balaceToPaidByCustomer = await this.calculateBalanceToPaidByCustomer(
      goldPieceValue,
      adminFeesRenewal,
      renewalDetails.remaining_balance,
      adminConfig.reserve_rate,
      availableTopUpValue,
    );
    const customerNewBalance = await this.calculateNewBalance(
      renewalDetails.customer_request_topup,
      renewalDetails.remaining_balance,
      availableTopUpValue,
    );
    const margin = await this.calculateMargin(
      customerNewBalance,
      adminConfig.margin_rate,
      renewalDetails.buyBackTermInMonths,
    );
    const buyBackPrice = await this.calculateBuyBackPrice(
      goldPieceValue,
      margin,
    );
    const advancePaymentByCustomer =
      await this.calculateAdvancePaymentByCustomer(
        goldPieceValue,
        customerNewBalance,
      );
    const installmentValue = await this.calculateInstallmentValue(
      margin,
      renewalDetails.buyBackTermInMonths,
    );
    const balanceToCompleteSellback =
      netPurChasePriceFromCustomer - advancePaymentByCustomer;
    const available_liquidity_to_customer =
      await this.calculateAvailableLiquidityToCustomer(
        netPurChasePriceFromCustomer,
        advancePaymentByCustomer,
      );

    const liquidation_costs =
      goldPieceValue * (adminConfig?.liquidation_cost / 100);
    const new_gold_liquidation_value = goldPieceValue - liquidation_costs;
    const funds_due_to_customer =
      new_gold_liquidation_value - balanceToCompleteSellback;

    return {
      karatagePricePerGram: parseFloat(karatagePricePerGram.toFixed(2)),
      goldPieceValue: parseFloat(goldPieceValue.toFixed(2)),
      adminFeesRenewal: parseFloat(adminFeesRenewal.toFixed(2)),
      netPurChasePriceFromCustomer: parseFloat(
        netPurChasePriceFromCustomer.toFixed(2),
      ),
      availableTopUpValue: parseFloat(availableTopUpValue.toFixed(2)),
      balaceToPaidByCustomer: parseFloat(balaceToPaidByCustomer.toFixed(2)),
      customerNewBalance: parseFloat(customerNewBalance.toFixed(2)),
      margin: parseFloat(margin.toFixed(2)),
      buyBackPrice: parseFloat(buyBackPrice.toFixed(2)),
      advancePaymentByCustomer: parseFloat(advancePaymentByCustomer.toFixed(2)),
      installmentValue: parseFloat(installmentValue.toFixed(2)),
      balanceToCompleteSellback: parseFloat(
        balanceToCompleteSellback.toFixed(2),
      ),
      buyBackTermInMonths: renewalDetails?.buyBackTermInMonths,
      margin_rate: adminConfig.margin_rate,
      reserve_rate: adminConfig?.reserve_rate,
      admin_fee_rate: adminConfig?.admin_fee_rate,
      admin_fee_rate_renewal: adminConfig?.admin_fee_rate_renewal,
      gold_price_24_karate: adminConfig?.gold_price_24_karate,
      available_liquidity_to_customer,
      liquidation_cost_rate: adminConfig?.liquidation_cost,
      liquidation_costs,
      new_gold_liquidation_value,
      funds_due_to_customer,
    };
  }

  async calculateAdminFeesRenewal(
    goldPieceValue: number,
    admin_fee_rate_renewal: number,
  ): Promise<number> {
    const adminFeesRenewal = goldPieceValue * (admin_fee_rate_renewal / 100);
    return adminFeesRenewal;
  }

  async calculateTopUpValue(
    remaining_balance: number,
    goldPieceValue: number,
    reserve_rate: number,
    adminFeesRenewal: number,
  ): Promise<number> {
    if (
      remaining_balance <
        (1 - reserve_rate / 100) * goldPieceValue - adminFeesRenewal ||
      ((1 - reserve_rate / 100) * goldPieceValue -
        remaining_balance -
        adminFeesRenewal &&
        0)
    ) {
      const availableTopUpValue =
        (1 - reserve_rate / 100) * goldPieceValue -
        remaining_balance -
        adminFeesRenewal;
      return availableTopUpValue;
    } else {
      const availableTopUpValue = 0;
      return availableTopUpValue;
    }
  }

  async calculateBalanceToPaidByCustomer(
    goldPieceValue: number,
    adminFeesRenewal: number,
    remaining_balance: number,
    reserve_rate: number,
    availableTopUpValue: number,
  ): Promise<any> {
    if (
      availableTopUpValue === 0 &&
      (remaining_balance <
        1 - (reserve_rate / 100) * goldPieceValue - adminFeesRenewal ||
        Math.abs(
          (reserve_rate / 100) * goldPieceValue -
            remaining_balance -
            adminFeesRenewal,
        ) ||
        0)
    ) {
      const balaceToPaidByCustomer = Math.abs(
        (reserve_rate / 100) * goldPieceValue -
          remaining_balance -
          adminFeesRenewal,
      );
      return parseFloat(balaceToPaidByCustomer.toFixed(2));
    } else {
      const balaceToPaidByCustomer = 0;
      return balaceToPaidByCustomer;
    }
  }

  async calculateNewBalance(
    customerRequestTopUp: number,
    remaining_balance: number,
    availableTopUpValue: number,
  ): Promise<any> {
    if (
      customerRequestTopUp == 1 ||
      remaining_balance + availableTopUpValue < 0 ||
      remaining_balance < 0
    ) {
      const customerNewBalance = remaining_balance + availableTopUpValue;
      return customerNewBalance;
    } else {
      return remaining_balance;
    }
  }

  async getInstallmentDates(buyBackTermInMonths: number): Promise<any> {
    const dates = [];
    const currentDate = new Date();
    for (let i = 0; i < buyBackTermInMonths; i++) {
      const futureDate = add_days(currentDate, 30 * (i + 1));
      dates.push(futureDate);
    }
    return dates;
  }

  async getCustomerGoldValuations(
    user_id: string,
    i18n: I18nContext,
    db_name: string,
  ): Promise<InitialValuations[] | any> {
    this.initialValuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );

    const customerInitialValuations = await this.initialValuationModel
      .find({
        customer_id: user_id,
        loan_estimation_delete_date: null,
        is_completed: false,
      })
      .sort({ _id: -1 });

    if (!customerInitialValuations.length) {
      throw new NotFoundException({
        message: i18n.t(`lang.gold_loan.valuation_not_found`),
        data: {},
      });
    }

    const customer = await this.customerService.getUserProfile(
      user_id,
      db_name,
    );

    const formattedValuations = await Promise.all(
      customerInitialValuations.map(
        async ({
          id,
          customer_cash_needs,
          cash_to_customer,
          gold_weight,
          gold_purity_entered_per_1000,
          tenure_in_months,
          valuation_number,
          available_liquidity_to_customer,
        }) => ({
          valuation_id: id,
          valuation_number: valuation_number,
          customer_cash_needs: await this.formatCurrency(
            customer_cash_needs,
            i18n,
          ),
          cash_to_customer: await this.formatCurrency(cash_to_customer, i18n),
          available_liquidity_to_customer: await this.formatCurrency(
            available_liquidity_to_customer || 0,
            i18n,
          ),
          gold_weight,
          gold_purity_entered_per_1000,
          tenure: `${tenure_in_months} ${i18n.t('lang.gold_loan.months')}`,
          is_applied: await this.appointmentService
            .getUserAllAppointMents(id, db_name, i18n)
            .then((appointments) => appointments.length > 0),
        }),
      ),
    );
    const totalValuation = await customerInitialValuations.reduce(
      async (acc, { available_liquidity_to_customer, id }) => {
        const accValue = await acc;
        const is_applied = await this.appointmentService
          .getUserAllAppointMents(id, db_name, i18n)
          .then((appointments) => appointments.length > 0);

        if (is_applied === false) {
          return accValue + available_liquidity_to_customer;
        }
        return accValue;
      },
      0,
    );

    return {
      total_valuation: await this.formatCurrency(totalValuation, i18n),
      valuation_list: formattedValuations,
      customer: {
        id: customer.id,
        email: customer?.email,
        full_name: `${customer.first_name} ${customer.last_name}`,
        phone: `${customer.country_code} ${customer.phone}`,
      },
    };
  }

  async deleteCustomerGoldValuations(
    customerIniatialLoanEstimationDTO: CustomerIniatialLoanEstimationDTO,
    user_id: string,
    db_name,
    i18n: I18nContext,
  ): Promise<any> {
    this.initialValuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );
    const user = await this.customerService.getUserProfile(user_id, db_name);
    if (!user) {
      throw new BadRequestException({
        message: i18n.t(`lang.auth.invalid_user`),
        data: {},
      });
    }
    const InitialValuation = await this.initialValuationModel.findOneAndUpdate(
      {
        _id: customerIniatialLoanEstimationDTO.valuation_id,
        customer_id: user_id,
      },
      {
        $set: {
          loan_estimation_delete_date: date_moment(),
        },
      },
      { new: true },
    );
    // await InitialValuation.save();
    if (!InitialValuation) {
      throw new NotFoundException({
        message: i18n.t(`lang.gold_loan.valuation_not_found`),
        data: {},
      });
    }
    return {
      message: i18n.t(`lang.gold_loan.valuation_deleted`),
      data: {},
    };
  }

  async getInitialCustomerGoldValuations(
    customerIniatialLoanEstimationDTO: CustomerIniatialLoanEstimationDTO,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.initialValuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );
    const user = await this.customerService.getUserProfile(user_id, db_name);
    if (!user) {
      throw new BadRequestException({
        message: i18n.t(`lang.auth.invalid_user`),
        data: {},
      });
    }
    const customerLoanEstimation = await this.initialValuationModel
      .find({
        _id: { $in: customerIniatialLoanEstimationDTO.valuation_id },
        customer_id: user_id,
        loan_estimation_delete_date: null,
      })
      .exec();

    if (customerLoanEstimation.length === 0) {
      throw new NotFoundException({
        message: i18n.t(`lang.gold_loan.valuation_not_found`),
        data: [],
      });
    }
    return {
      message: i18n.t(`lang.gold_loan.user_valuations`),
      data: customerLoanEstimation,
    };
  }

  async kycVerification(
    customerKycVerificationDto: CustomerKycVerificationDto,
    db_name: string,
    user_id: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.userKycDetails = setTanantConnection(
      db_name,
      UserKycDetails.name,
      UserKycDetailsSchema,
    );

    const user = await this.customerService.getUserProfile(user_id, db_name);
    if (!user) {
      throw new NotFoundException(i18n.t('lang.auth.no_user'));
    }

    const customerKycDetails = await this.userKycDetails
      .findOne({
        customer_id: new mongoose.Types.ObjectId(user.id),
      })
      .exec();

    const kycPayload = {
      reference_id: customerKycVerificationDto?.reference_id,
      expiry_date: customerKycVerificationDto?.expiry_date,
      expiry_status: customerKycVerificationDto?.expiry_status,
      kyc_status: customerKycVerificationDto.kyc_status,
      kyc_details: customerKycVerificationDto?.kyc_details,
      document_type: customerKycVerificationDto?.document_type,
      kyc_documents: customerKycVerificationDto?.kyc_documents,
      kyc_date: date_moment(),
    };

    if (customerKycDetails) {
      const res = await this.userKycDetails.findOneAndUpdate(
        { customer_id: user_id },
        {
          $set: kycPayload,
        },
        { new: true },
      );
      console.log(res);
    } else {
      const newKycDetails = new this.userKycDetails({
        customer_id: user_id,
        ...kycPayload,
      });
      try {
        await newKycDetails.save();
      } catch (error) {
        console.log(error.message);
      }
    }

    await this.customerNotificationService.sendPushNotification(
      user_id,
      'kyc_document_upload',
      'notification',
      3,
      db_name,
    );

    return {};
  }

  async addKycDocuments(
    kycVerificationDto: KycVerificationDto,
    id: string,
    accessToken: string,
    db_name: string,
  ): Promise<any> {
    this.userKycDetails = setTanantConnection(
      db_name,
      UserKycDetails.name,
      UserKycDetailsSchema,
    );

    const document_proof_url =
      kycVerificationDto?.kyc_details?.['proofs']?.document?.proof;
    const document_proof_response = await axios.post(
      document_proof_url,
      { access_token: accessToken },
      { responseType: 'stream' },
    );
    const document_proof = document_proof_response.data;

    const document_additional_proof_url =
      kycVerificationDto?.kyc_details?.['proofs']?.document?.additional_proof;
    if (document_additional_proof_url) {
      const document_additional_proof_response = await axios.post(
        document_additional_proof_url,
        { access_token: accessToken },
      );
      const document_additional_proof = document_additional_proof_response.data;
    }

    const face_proof_url =
      kycVerificationDto?.kyc_details?.['proofs']?.face?.proof;
    const face_proof_response = await axios.post(
      face_proof_url,
      { access_token: accessToken },
      { responseType: 'stream' },
    );
    const face_proof = face_proof_response.data;

    const verification_report_url =
      kycVerificationDto?.kyc_details?.['proofs']?.verification_report;
    const verification_report_response = await axios.post(
      verification_report_url,
      { access_token: accessToken },
    );
    const verification_report = verification_report_response.data;

    const filePath1 = documentUpload(
      document_proof,
      'document_proof',
      id,
      document_proof_response.headers['content-type'].split('/')[1],
    );
    const filePath3 = documentUpload(
      face_proof,
      'face_proof',
      id,
      face_proof_response.headers['content-type'].split('/')[1],
    );
    const filePath4 = documentUpload(
      verification_report,
      'verification_report',
      id,
      verification_report_response.headers['content-type'].split('/')[1],
    );

    const updatedUser = await this.userKycDetails.findOneAndUpdate(
      { user_id: id },
      {
        $set: {
          document_proof: filePath1,
          // document_additional_proof: filePath2,
          face_proof: filePath3,
          verification_report: filePath4,
        },
      },
      { new: true },
    );
    return updatedUser;
  }

  async getKycVerificationDetails(
    id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.userKycDetails = setTanantConnection(
      db_name,
      UserKycDetails.name,
      UserKycDetailsSchema,
    );
    const user = await this.customerService.getUserProfile(id, db_name);
    if (!user) {
      throw new NotFoundException(i18n.t(`lang.auth.no_user`));
    }

    const user_kyc_details = await this.userKycDetails
      .findOne({
        customer_id: new mongoose.Types.ObjectId(user.id),
      })
      .exec();

    if (!user_kyc_details) {
      throw new NotFoundException(i18n.t(`lang.kyc.user_kyc_not_found`));
    }

    return {
      expiry_status: user_kyc_details.expiry_status,
      kyc_status: user_kyc_details?.kyc_status || '',
      document_type: user_kyc_details?.document_type || '',
      kyc_details: user_kyc_details?.kyc_details || '',
      kyc_documents: user_kyc_details?.kyc_documents || '',
    };
  }

  async KycApprovedDisapprovedStatus(
    kycApprovedDisapprovedStatusDto: KycApprovedDisapprovedStatusDto,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.userKycDetails = setTanantConnection(
      db_name,
      UserKycDetails.name,
      UserKycDetailsSchema,
    );

    const user = await this.authService.getUserProfile(
      kycApprovedDisapprovedStatusDto.review_by,
      db_name,
    );
    if (!user) {
      throw new NotFoundException(i18n.t(`lang.auth.no_user`));
    }

    const user_kyc_details = await this.userKycDetails
      .findOne({
        customer_id: new mongoose.Types.ObjectId(
          kycApprovedDisapprovedStatusDto.customer_id,
        ),
      })
      .exec();

    if (kycApprovedDisapprovedStatusDto?.review_status === 'Approved') {
      const isKycVerified =
        kycApprovedDisapprovedStatusDto?.review_status === 'Approved';
      await this.customerService.updateKycStatus(
        db_name,
        {
          customer_id: kycApprovedDisapprovedStatusDto.customer_id,
          is_kyc_verified: isKycVerified,
        },
        i18n,
      );
    }

    if (!user_kyc_details) {
      throw new NotFoundException(i18n.t(`lang.kyc.user_kyc_not_found`));
    }

    await this.userKycDetails.findOneAndUpdate(
      { customer_id: kycApprovedDisapprovedStatusDto.customer_id },
      {
        $set: {
          review_by: kycApprovedDisapprovedStatusDto?.review_by,
          review_status: kycApprovedDisapprovedStatusDto?.review_status,
          reason: kycApprovedDisapprovedStatusDto?.reason,
          is_front_side_doc_verified: kycApprovedDisapprovedStatusDto?.is_front_side_doc_verified,
          is_back_side_doc_verified: kycApprovedDisapprovedStatusDto?.is_back_side_doc_verified,
          is_selfie_verified: kycApprovedDisapprovedStatusDto?.is_selfie_verified
        },
      },
      { new: true },
    );

    return {};
  }

  async getAllKycVerificationDetails(
    id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.userKycDetails = setTanantConnection(
      db_name,
      UserKycDetails.name,
      UserKycDetailsSchema,
    );

    const user_kyc_details = await this.userKycDetails.find().exec();

    if (!user_kyc_details || user_kyc_details.length === 0) {
      throw new NotFoundException({
        message: i18n.t(`lang.kyc.user_kyc_not_found`),
        data: [],
      });
    }

    const kycDetailsList = await Promise.all(
      user_kyc_details.map(async (detail) => {
        const user = await this.customerService.getUserProfile(
          (detail?.customer_id).toString(),
          db_name,
        );
        return {
          customer_id: detail?.customer_id,
          reference_id: detail?.reference_id || '',
          kyc_status: detail?.kyc_status || '',
          kyc_date: detail?.kyc_date || '',
          expiry_date: detail?.expiry_date || '',
          expiry_status: detail?.expiry_status,
          review_by: detail?.review_by || '',
          review_status: detail?.review_status || '',
          is_front_side_doc_verified: detail?.is_front_side_doc_verified || '',
          is_back_side_doc_verified: detail?.is_back_side_doc_verified || '',
          is_selfie_verified: detail?.is_selfie_verified || '',
          reason: detail?.reason || '',
          document_type: detail?.document_type || '',
          name: detail?.kyc_details?.name || '',
          family_name: detail?.kyc_details?.family_name || '',
          address: detail?.kyc_details?.address || '',
          address_details: detail?.kyc_details?.address_details || '',
          street: detail?.kyc_details?.street || '',
          subdistrict: detail?.kyc_details?.subdistrict || '',
          district: detail?.kyc_details?.district || '',
          governorate: detail?.kyc_details?.governorate || '',
          serial_number: detail?.kyc_details?.serial_number || '',
          birthdate: detail?.kyc_details?.birthdate || '',
          face_image_url: detail?.kyc_details?.face_image_url || '',
          birth_governorate: detail?.kyc_details?.birth_governorate || '',
          front_image_url: detail?.kyc_details?.front_document_url || '',
          national_id: detail?.kyc_details?.national_id || '',
          expiration_date: detail?.kyc_details?.expiration_date || '',
          isExpired: detail?.kyc_details?.isExpired || false,
          job_title: detail?.kyc_details?.job_title || '',
          job_place: detail?.kyc_details?.job_place || '',
          marital_status: detail?.kyc_details?.marital_status || '',
          religion: detail?.kyc_details?.religion || '',
          gender: detail?.kyc_details?.gender || '',
          issue_date: detail?.kyc_details?.issue_date || '',
          back_image_url: detail?.kyc_details?.back_document_url || '',
          first_name: user?.first_name || '',
          last_name: user?.last_name || '',
          profile_image: user?.profile_image || '',
          email: user?.email || '',
          mobile_number: `${user?.country_code}${user?.phone}` || '',
          user_full_name: `${user?.first_name || ''} ${user?.last_name || ''}`,
          user_email: user?.email || '',
          remarks: '',
          kyc_documents: detail?.kyc_documents || {},
        };
      }),
    );
    return kycDetailsList;
  }

  async getCustomerLoanEstimation(
    id: string,
    customer_id: string,
    db_name: string,
  ): Promise<InitialValuations> {
    this.initialValuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );

    let customerInitialValuation;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      customerInitialValuation = await this.initialValuationModel
        .findById({ _id: id, customer_id: customer_id })
        .exec();
    }
    return customerInitialValuation ? customerInitialValuation : false;
  }

  async updateInitialValuationStatus(
    valuation_id: string,
    customer_id: string,
    db_name: string,
  ): Promise<any> {
    this.initialValuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );

    try {
      const initialValuation =
        await this.initialValuationModel.findOneAndUpdate(
          {
            _id: valuation_id,
            customer_id: customer_id,
          },
          {
            $set: {
              is_completed: true,
              is_branch_visited: true,
            },
          },
          { new: true },
        );
      return initialValuation;
    } catch (error) {
      throw new error();
    }
  }

  async updateValuationStatus(
    valuation_id: string,
    valuation_status: number,
    db_name: string,
    branch_id?: string,
  ): Promise<any> {
    this.initialValuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );

    try {
      const initialValuation =
        await this.initialValuationModel.findOneAndUpdate(
          { _id: valuation_id },
          { $set: { valuation_status, branch_id } },
          { new: true },
        );
      return initialValuation;
    } catch (error) {
      throw new error();
    }
  }

  async getStoreAllValuationDetails(
    valuation_type: string,
    store_id: string,
    db_name: string,
    i18n: I18nContext,
  ) {
    this.initialValuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );

    const fetchValuations =
      valuation_type === 'applied'
        ? this.getAppliedValuations(store_id, db_name, i18n)
        : valuation_type === 'pending'
          ? this.getPendingValuations(db_name, i18n)
          : Promise.resolve([]);
    return await fetchValuations;
  }

  async getAppliedValuations(
    store_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<InitialValuations[]> {
    this.initialValuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );

    const valuations = await this.initialValuationModel
      .aggregate([
        {
          $match: {
            $and: [
              { valuation_status: { $ne: 9 } },
              { valuation_status: { $ne: null } },
              ...(store_id
                ? [{ branch_id: new mongoose.Types.ObjectId(store_id) }]
                : []),
            ],
          },
        },
        {
          $lookup: {
            from: 'loans',
            let: { valuationId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$valuation_id', '$$valuationId'],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  loan_id: 1,
                  liquidate_number: 1,
                },
              },
            ],
            as: 'loans',
          },
        },
        {
          $unwind: {
            path: '$loans',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            total_margin: {
              $multiply: [
                '$cash_to_customer',
                { $divide: ['$margin_rate', 100] },
                '$tenure_in_months',
              ],
            },
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
              {
                $project: {
                  _id: 1,
                  store_id: 1,
                },
              },
            ],
            as: 'appointments',
          },
        },
        {
          $addFields: {
            hasAppointments: { $gt: [{ $size: '$appointments' }, 0] },
          },
        },
        {
          $match: {
            $expr: {
              $or: [
                { $eq: ['$hasAppointments', false] },
                {
                  $and: [
                    { $eq: ['$hasAppointments', true] },
                    ...(store_id
                      ? [{ store_id: new mongoose.Types.ObjectId(store_id) }]
                      : []),
                  ],
                },
              ],
            },
          },
        },
        {
          $project: {
            _id: 1,
            store_id: { $ifNull: ['$branch_id', ''] },
            valuation_id: '$_id',
            customer_id: 1,
            valuation_number: 1,
            valuation_status: 1,
            total_margin: 1,
            gold_rate_at_valuation: 1,
            cash_to_customer: 1,
            available_liquidity_to_customer: 1,
            customer_cash_needs: 1,
            gold_weight: 1,
            gold_purity_entered_per_1000: 1,
            margin_rate: 1,
            tenure: '$tenure_in_months',
            liquidity_id: '$loans._id',
            liquidate_number: '$loans.liquidate_number',
            loan_estimation_calculated_date: 1,
          },
        },
        {
          $group: {
            _id: '$_id',
            store_id: { $first: '$store_id' },
            valuation_id: { $first: '$valuation_id' },
            customer_id: { $first: '$customer_id' },
            valuation_number: { $first: '$valuation_number' },
            valuation_status: { $first: '$valuation_status' },
            total_margin: { $first: '$total_margin' },
            gold_rate_at_valuation: { $first: '$gold_rate_at_valuation' },
            cash_to_customer: { $first: '$cash_to_customer' },
            customer_cash_needs: { $first: '$customer_cash_needs' },
            available_liquidity_to_customer: {
              $first: '$available_liquidity_to_customer',
            },
            gold_weight: { $first: '$gold_weight' },
            gold_purity_entered_per_1000: {
              $first: '$gold_purity_entered_per_1000',
            },
            margin_rate: { $first: '$margin_rate' },
            tenure: { $first: '$tenure' },
            liquidity_id: { $first: '$liquidity_id' },
            liquidate_number: { $first: '$liquidate_number' },
            loan_estimation_calculated_date: {
              $first: '$loan_estimation_calculated_date',
            },
          },
        },
        {
          $sort: {
            loan_estimation_calculated_date: -1,
          },
        },
      ])
      .exec();

    return await Promise.all(
      valuations.map(async (valuation) => {
        const valuation_status =
          await this.applicationStatusService.getAllApplicationStatus(
            valuation?._id,
            db_name,
            i18n,
          );
        const formattedData = {
          ...valuation,
          gold_rate_at_valuation: await this.formatCurrency(
            valuation.gold_rate_at_valuation,
            i18n,
          ),
          cash_to_customer: await this.formatCurrency(
            valuation.cash_to_customer,
            i18n,
          ),
          available_liquidity_to_customer: await this.formatCurrency(
            valuation?.available_liquidity_to_customer || 0,
            i18n,
          ),
          customer_cash_needs: await this.formatCurrency(
            valuation.customer_cash_needs,
            i18n,
          ),
          total_margin: await this.formatCurrency(valuation.total_margin, i18n),
          installment: await this.formatCurrency(
            valuation.total_margin / valuation.tenure,
            i18n,
          ),
          tenure: `${valuation.tenure} ${i18n.t('lang.gold_loan.months')}`,
          valuation_status: valuation_status,
          current_status: valuation?.valuation_status,
          agreements:
            [5, 6, 7].includes(valuation?.valuation_status) &&
            valuation?.liquidity_id
              ? await this.agreementTemplateService.getLoanAgreementTemplates(
                  { loan_id: valuation.liquidity_id, agreement_type: 1 },
                  db_name,
                  i18n,
                )
              : [],
        };
        return formattedData;
      }),
    );
  }

  async getPendingValuations(
    db_name: string,
    i18n: I18nContext,
  ): Promise<InitialValuations[]> {
    this.initialValuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );
    const valuations = await this.initialValuationModel
      .aggregate([
        {
          $match: {
            $or: [
              { valuation_status: { $exists: false } },
              { valuation_status: { $eq: null } },
            ],
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
          $match: {
            appointments: { $size: 0 },
          },
        },
        {
          $project: {
            _id: 1,
            valuation_id: 1,
            customer_id: 1,
            valuation_number: 1,
            gold_rate_at_valuation: 1,
            cash_to_customer: 1,
            available_liquidity_to_customer: 1,
            customer_cash_needs: 1,
            gold_weight: 1,
            gold_purity_entered_per_1000: 1,
            tenure: '$tenure_in_months',
            estimation_calculated_date: '$loan_estimation_calculated_date',
          },
        },
        {
          $sort: {
            estimation_calculated_date: -1,
          },
        },
      ])
      .exec();

    return await Promise.all(
      valuations.map(async (valuation) => {
        const formattedData = {
          ...valuation,
          gold_rate_at_valuation: await this.formatCurrency(
            valuation.gold_rate_at_valuation,
            i18n,
          ),
          cash_to_customer: await this.formatCurrency(
            valuation.cash_to_customer,
            i18n,
          ),
          available_liquidity_to_customer: await this.formatCurrency(
            valuation?.available_liquidity_to_customer || 0,
            i18n,
          ),
          customer_cash_needs: await this.formatCurrency(
            valuation.customer_cash_needs,
            i18n,
          ),
          tenure: `${valuation.tenure} ${i18n.t('lang.gold_loan.months')}`,
        };
        return formattedData;
      }),
    );
  }

  async fetchCustomerValuations(
    db_name: string,
    i18n: I18nContext,
    searchCriteria: any,
    store_id?: string,
  ): Promise<any[]> {
    const results = await this.customerModel
      .aggregate([
        { $match: searchCriteria },
        {
          $lookup: {
            from: 'loanappointmentbookings',
            localField: '_id',
            foreignField: 'customer_id',
            as: 'appointments',
          },
        },
        { $unwind: '$appointments' },
        {
          $lookup: {
            from: 'initialvaluations',
            localField: 'appointments.valuation_id',
            foreignField: '_id',
            as: 'valuations',
          },
        },
        {
          $match: {
            $and: [
              { 'valuations.valuation_status': { $ne: 9 } },
              { 'valuations.valuation_status': { $ne: null } },
            ],
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
            customer_id: '$_id',
            full_name: { $concat: ['$first_name', ' ', '$last_name'] },
            profile_image: { $ifNull: ['$profile_image', ''] },
            email: 1,
            is_kyc_verified: { $ifNull: ['$is_kyc_verified', false] },
            phone: { $concat: ['$country_code', ' ', '$phone'] },
            kyc_status: { $ifNull: ['$kyc_details.kyc_status', ''] },
            review_by: {
              $ifNull: ['$kyc_details.review_by', ''],
            },
            review_status: {
              $ifNull: ['$kyc_details.review_status', ''],
            },
            valuations: {
              $map: {
                input: '$valuations',
                as: 'valuation',
                in: {
                  valuation_id: '$$valuation._id',
                  valuation_number: '$$valuation.valuation_number',
                  gold_weight: '$$valuation.gold_weight',
                  gold_purity_entered_per_1000:
                    '$$valuation.gold_purity_entered_per_1000',
                  cash_to_customer: '$$valuation.cash_to_customer',
                  available_liquidity_to_customer:
                    '$$valuation.available_liquidity_to_customer',
                  customer_cash_needs: '$$valuation.customer_cash_needs',
                  gold_rate_at_valuation: '$$valuation.gold_rate_at_valuation',
                  tenure_in_months: '$$valuation.tenure_in_months',
                  valuation_status: '$$valuation.valuation_status',
                },
              },
            },
            appointment_id: '$appointments._id',
            booking_number: '$appointments.booking_number',
            appointment_type: {
              $ifNull: ['$appointments.appointment_type', 0],
            },
            time_slot_id: '$appointments.time_slot_id',
            booking_date: '$appointments.booking_date',
          },
        },
        {
          $match: {
            valuations: { $ne: [] },
          },
        },
      ])
      .exec();

    return await Promise.all(
      results.map(async (result) => {
        const formattedValuations = await Promise.all(
          result.valuations.map(async (valuation) => {
            const application_status =
              await this.applicationStatusService.getAllApplicationStatus(
                valuation.valuation_id,
                db_name,
                i18n,
              );
            const loan = await this.loanService.findLoanByValuation(
              valuation.valuation_id,
              db_name,
            );
            const formattedValuation = {
              ...valuation,
              gold_rate_at_valuation: await this.formatCurrency(
                valuation.gold_rate_at_valuation,
                i18n,
              ),
              cash_to_customer: await this.formatCurrency(
                valuation.cash_to_customer,
                i18n,
              ),
              available_liquidity_to_customer: await this.formatCurrency(
                valuation?.available_liquidity_to_customer || 0,
                i18n,
              ),
              customer_cash_needs: await this.formatCurrency(
                valuation.customer_cash_needs,
                i18n,
              ),
              application_status,
            };
            return {
              ...formattedValuation,
              liquidity_id: loan?.id || '',
              liquidity_number: loan?.liquidate_number || '',
            };
          }),
        );

        const appointment_time =
          await this.storeAvailabilityService.getBranchAvailability(
            result.time_slot_id.toString(),
            db_name,
          );
        return {
          ...result,
          valuations: formattedValuations,
          day: appointment_time?.day,
          appointment_start_time: appointment_time?.start_time,
          appointment_end_time: appointment_time?.end_time,
        };
      }),
    );
  }

  async fetchAppointmentDetails(
    db_name: string,
    i18n: I18nContext,
    searchTerm: string,
  ): Promise<any[]> {
    this.initialValuationModel = setTanantConnection(
      db_name,
      InitialValuations.name,
      InitialValuationSchema,
    );
    const results = await this.initialValuationModel
      .aggregate([
        {
          $match: {
            valuation_number: searchTerm,
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
            from: 'loanappointmentbookings',
            localField: '_id',
            foreignField: 'valuation_id',
            as: 'appointments',
          },
        },
        {
          $unwind: {
            path: '$appointments',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'loans',
            localField: '_id',
            foreignField: 'valuation_id',
            as: 'loan',
          },
        },
        {
          $unwind: {
            path: '$loan',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'userkycdetails',
            localField: 'customer_id',
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
            customer_id: '$customer._id',
            full_name: {
              $concat: [
                { $ifNull: ['$customer.first_name', ''] },
                ' ',
                { $ifNull: ['$customer.last_name', ''] },
              ],
            },
            profile_image: { $ifNull: ['$customer.profile_image', ''] },
            email: { $ifNull: ['$customer.email', ''] },
            is_kyc_verified: { $ifNull: ['$customer.is_kyc_verified', false] },
            kyc_status: { $ifNull: ['$kyc_details.kyc_status', ''] },
            review_by: {
              $ifNull: ['$kyc_details.review_by', ''],
            },
            review_status: {
              $ifNull: ['$kyc_details.review_status', ''],
            },
            phone: {
              $concat: [
                { $ifNull: ['$customer.country_code', ''] },
                ' ',
                { $ifNull: ['$customer.phone', ''] },
              ],
            },
            valuations: [
              {
                valuation_id: '$_id',
                liquidity_id: { $ifNull: ['$loan._id', ''] },
                valuation_number: '$valuation_number',
                gold_weight: '$gold_weight',
                gold_purity_entered_per_1000: '$gold_purity_entered_per_1000',
                cash_to_customer: '$cash_to_customer',
                customer_cash_needs: '$customer_cash_needs',
                gold_rate_at_valuation: '$gold_rate_at_valuation',
                tenure_in_months: '$tenure_in_months',
                valuation_status: { $ifNull: ['$valuation_status', 0] },
                available_liquidity_to_customer:
                  '$available_liquidity_to_customer',
              },
            ],
            appointment_id: { $ifNull: ['$appointments._id', ''] },
            booking_number: { $ifNull: ['$appointments.booking_number', ''] },
            appointment_type: {
              $ifNull: ['$appointments.appointment_type', 0],
            },
            time_slot_id: { $ifNull: ['$appointments.time_slot_id', ''] },
            booking_date: { $ifNull: ['$appointments.booking_date', ''] },
          },
        },
      ])
      .limit(1);

    return await Promise.all(
      results.map(async (result) => {
        const application_status =
          await this.applicationStatusService.getAllApplicationStatus(
            result._id,
            db_name,
            i18n,
          );
        const formattedValuations = await Promise.all(
          result.valuations.map(async (valuation) => ({
            ...valuation,
            gold_rate_at_valuation: await this.formatCurrency(
              valuation.gold_rate_at_valuation,
              i18n,
            ),
            cash_to_customer: await this.formatCurrency(
              valuation.cash_to_customer,
              i18n,
            ),
            available_liquidity_to_customer: await this.formatCurrency(
              valuation?.available_liquidity_to_customer || 0,
              i18n,
            ),
            customer_cash_needs: await this.formatCurrency(
              valuation.customer_cash_needs,
              i18n,
            ),
            application_status: application_status,
          })),
        );

        const appointment_time =
          await this.storeAvailabilityService.getBranchAvailability(
            result.time_slot_id.toString(),
            db_name,
          );

        return {
          ...result,
          valuations: formattedValuations,
          day: appointment_time?.day,
          appointment_start_time: appointment_time?.start_time,
          appointment_end_time: appointment_time?.end_time,
        };
      }),
    );
  }

  async getValuations(
    db_name: string,
    i18n: I18nContext,
    searchTerm?: string,
    store_id?: string,
    type?: number,
  ): Promise<InitialValuations[]> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );

    let searchCriteria: any = {};
    if (type == 1 && searchTerm) {
      return this.fetchAppointmentDetails(db_name, i18n, searchTerm);
    } else if (type == 2 && searchTerm) {
      this.initialValuationModel = setTanantConnection(
        db_name,
        InitialValuations.name,
        InitialValuationSchema,
      );

      const adminConfig = await this.adminConfigService.getCustomerPriceConfig(
        searchTerm,
        db_name,
        i18n,
      );
      const {min_admin_purchase_fees}= adminConfig
      const matchStage: any = {
        valuation_status: { $nin: [9,null], $exists: true, },
      };

      if (searchTerm) {
        matchStage['customer_id'] = new mongoose.Types.ObjectId(searchTerm);
      }

      const valuations = await this.initialValuationModel
        .aggregate([
          {
            $match: matchStage,
          },
          {
            $lookup: {
              from: 'loanappointmentbookings',
              let: { valuationId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $in: ['$$valuationId', '$valuation_id'] },
                        { $eq: ['$appointment_type', 1] },
                      ],
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
          {
            $lookup: {
              from: 'loans',
              let: { valuationId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$valuation_id', '$$valuationId'],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    loan_id: 1,
                  },
                },
              ],
              as: 'loans',
            },
          },
          {
            $unwind: {
              path: '$loans',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'userkycdetails',
              localField: 'customer_id',
              foreignField: 'customer_id',
              as: '   ',
            },
          },
          {
            $unwind: {
              path: '$kyc_details',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              total_margin: {
                $multiply: [
                  '$cash_to_customer',
                  { $divide: ['$margin_rate', 100] },
                  '$tenure_in_months',
                ],
              },
              admin_fees: {
                $multiply: [
                  '$gold_rate_at_valuation',
                  { $divide: ['$admin_fee_rate', 100] },
                ],
              }
            },
          },
          {
            $project: {
              _id: 1,
              valuation_id: 1,
              valuation_number: 1,
              valuation_status: 1,
              total_margin: 1,
              admin_fees: {
                $cond: {
                  if: { $lt: ["$admin_fees", min_admin_purchase_fees] },
                  then: min_admin_purchase_fees,
                  else: "$admin_fees"
                }
              },
              gold_rate_at_valuation: 1,
              cash_to_customer: 1,
              available_liquidity_to_customer: 1,
              gold_weight: 1,
              gold_purity_entered_per_1000: 1,
              margin_rate: 1,
              tenure_in_months: '$tenure_in_months',
              appointment_id: { $ifNull: ['$appointments._id', ''] },
              appointment_number: { $ifNull: ['$appointments.booking_number', ''] },
              liquidity_id: { $ifNull: ['$loans._id', ''] },
              kyc_status: { $ifNull: ['$kyc_details.kyc_status', ''] },
              review_by: {
                $ifNull: ['$kyc_details.review_by', ''],
              },
              review_status: {
                $ifNull: ['$kyc_details.review_status', ''],
              },
              estimation_calculated_date: '$loan_estimation_calculated_date',
            },
          },
          {
            $sort: {
              estimation_calculated_date: -1,
            },
          },
        ])
        .exec();
      return await Promise.all(
        valuations.map(async (valuation) => {
          const application_status =
            await this.applicationStatusService.getAllApplicationStatus(
              valuation._id,
              db_name,
              i18n,
            );
          const formattedData = {
            ...valuation,
            gold_rate_at_valuation: await this.formatCurrency(
              valuation.gold_rate_at_valuation,
              i18n,
            ),
            cash_to_customer: await this.formatCurrency(
              valuation.cash_to_customer,
              i18n,
            ),
            admin_fees: await this.formatCurrency(
              valuation.admin_fees,
              i18n,
            ),
            available_liquidity_to_customer: await this.formatCurrency(
              valuation?.available_liquidity_to_customer || 0,
              i18n,
            ),
            total_margin: await this.formatCurrency(
              valuation.total_margin,
              i18n,
            ),
            installment: await this.formatCurrency(
              valuation.total_margin / valuation.tenure_in_months,
              i18n,
            ),
            tenure: `${valuation.tenure_in_months} ${i18n.t('lang.gold_loan.months')}`,
            application_status,
          };
          return formattedData;
        }),
      );
    } else {
      if (Types.ObjectId.isValid(searchTerm)) {
        searchCriteria._id = new Types.ObjectId(searchTerm);
      } else {
        const formattedPhoneNumber = searchTerm.replace(/\s+/g, '');
        searchCriteria = {
          $or: [
            { _id: { $regex: searchTerm, $options: 'i' } },
            {
              phone: searchTerm,
            },
            {
              $expr: {
                $or: [
                  {
                    $eq: [
                      { $concat: ['$country_code', '$phone'] },
                      `+${searchTerm}`,
                    ],
                  },
                  {
                    $eq: [
                      { $concat: ['$country_code', '$phone'] },
                      `${searchTerm}`,
                    ],
                  },
                  {
                    $eq: [
                      { $concat: ['$country_code', '$phone'] },
                      `+${formattedPhoneNumber}`,
                    ],
                  },
                  {
                    $eq: [
                      { $concat: ['$country_code', '$phone'] },
                      `${formattedPhoneNumber}`,
                    ],
                  },
                ],
              },
            },
            { first_name: { $regex: searchTerm, $options: 'i' } },
            { last_name: { $regex: searchTerm, $options: 'i' } },
            {
              $expr: {
                $regexMatch: {
                  input: { $concat: ['$first_name', ' ', '$last_name'] },
                  regex: new RegExp(searchTerm, 'i'),
                },
              },
            },
          ],
        };
      }
      return this.fetchCustomerValuations(
        db_name,
        i18n,
        searchCriteria,
        store_id,
      );
    }
  }
}

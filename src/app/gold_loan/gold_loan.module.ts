import { Module } from '@nestjs/common';
import { GoldLoanController } from './gold_loan.controller';
import { GoldLoanService } from './gold_loan.service';
import { AuthService } from 'src/app/auth/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MasterUser, MasterUserSchema } from 'src/app/user/master-user.schema';
import { TanantUser, TanantUserSchema } from 'src/app/user/tanant-user.schema';
import { Tanant, TanantSchema } from 'src/app/user/tanant.schema';
import { jwtConfig } from 'src/config/jwt.config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AuthGuard } from 'src/app/auth/guard/auth.guard';
import { PriceConfig, PriceConfigSchema } from './schema/price_config.schema';
import {
  UserKycDetails,
  UserKycDetailsSchema,
} from './schema/kyc_details.schema';
import {
  InitialValuations,
  InitialValuationSchema,
} from './schema/customer_loan_estimation.schema';
import { AdminConfigService } from './price_config.service';
import { AppointmentService } from '../appointment/services/appointment.service';
import { StoreAvailabilityService } from '../appointment/services/store_availability.service';
import { GlobalConfigService } from '../global_config/global_config.service';
import { StoreService } from '../store/store.service';
import { CustomerTagService } from '../../customer/service/customer_tag.service';
import { Tag, TagSchema } from './schema/tag.schema';
import { TagService } from './tag.service';
import { Customer, CustomerSchema } from 'src/customer/schema/customer.schema';
import { CustomerService } from 'src/customer/service/customer.service';
import { RolePermissionService } from '../role-permission/role-permission.service';
import { LoanService } from '../loan/service/loan.service';
import { LoanPaymentTransactionService } from '../loan_payment_transaction/loan_payment_transaction.service';
import { ApplicationStatusService } from '../appointment/services/application_status.service';
import { NotificationTemplateService } from '../notification_template/notification_template.service';
import { CustomerNotificationService } from '../notification/notification.service';
import { AgreementTemplateService } from '../agreement_template/agreement_template.service';
import { StaffNotificationsService } from '../staff_notifications/staff_notifications.service';
import { GoldItemService } from '../loan/service/gold_item.service';
import { LoanInstallmentService } from '../loan/service/loan_emi.service';
import { EmailTemplateService } from '../email_template/email_template.service';
import { BarcodeService } from '../loan/service/barcode.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tag.name, schema: TagSchema },
      { name: PriceConfig.name, schema: PriceConfigSchema },
      { name: UserKycDetails.name, schema: UserKycDetailsSchema },
      {
        name: InitialValuations.name,
        schema: InitialValuationSchema,
      },
      { name: TanantUser.name, schema: TanantUserSchema },
      { name: MasterUser.name, schema: MasterUserSchema },
      { name: Tanant.name, schema: TanantSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
    jwtConfig,
  ],
  controllers: [GoldLoanController],
  providers: [
    GoldLoanService,
    AuthService,
    AdminConfigService,
    AppointmentService,
    StoreAvailabilityService,
    StoreService,
    TagService,
    CustomerTagService,
    GlobalConfigService,
    CustomerService,
    RolePermissionService,
    LoanService,
    LoanPaymentTransactionService,
    ApplicationStatusService,
    NotificationTemplateService,
    CustomerNotificationService,
    AgreementTemplateService,
    StaffNotificationsService,
    GoldItemService,
    LoanInstallmentService,
    EmailTemplateService,
    BarcodeService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    Reflector,
    // {
    //     provide: APP_GUARD,
    //     useClass: RoleGuard,
    // },
  ],
})
export class GoldLoanModule {}

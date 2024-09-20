import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './service/customer.service';
import { CustomerTagService } from './service/customer_tag.service';
import { TagService } from 'src/app/gold_loan/tag.service';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AuthGuard } from 'src/app/auth/guard/auth.guard';
import { AuthService } from 'src/app/auth/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MasterUser, MasterUserSchema } from 'src/app/user/master-user.schema';
import { jwtConfig } from 'src/config/jwt.config';
import { Tanant, TanantSchema } from 'src/app/user/tanant.schema';
import { Customer, CustomerSchema } from './schema/customer.schema';
import { CustomerInsightService } from './service/customer_insight.service';
import { CustomerInsight, CustomerInsightSchema } from './schema/customer_insight.schema';
import { RolePermissionService } from 'src/app/role-permission/role-permission.service';
import { StoreService } from 'src/app/store/store.service';
import { AppointmentService } from 'src/app/appointment/services/appointment.service';
import { StoreAvailabilityService } from 'src/app/appointment/services/store_availability.service';
import { GoldLoanService } from 'src/app/gold_loan/gold_loan.service';
import { GlobalConfigService } from 'src/app/global_config/global_config.service';
import { AdminConfigService } from 'src/app/gold_loan/price_config.service';
import { LoanService } from 'src/app/loan/service/loan.service';
import { LoanPaymentTransactionService } from 'src/app/loan_payment_transaction/loan_payment_transaction.service';
import { ApplicationStatusService } from 'src/app/appointment/services/application_status.service';
import { NotificationTemplateService } from 'src/app/notification_template/notification_template.service';
import { CustomerNotificationService } from 'src/app/notification/notification.service';
import { AgreementTemplateService } from 'src/app/agreement_template/agreement_template.service';
import { StaffNotificationsService } from 'src/app/staff_notifications/staff_notifications.service';
import { GoldItemService } from 'src/app/loan/service/gold_item.service';
import { LoanInstallmentService } from 'src/app/loan/service/loan_emi.service';
import { EmailTemplateService } from 'src/app/email_template/email_template.service';
import { BarcodeService } from 'src/app/loan/service/barcode.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MasterUser.name, schema: MasterUserSchema },
      { name: Tanant.name, schema: TanantSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: CustomerInsight.name, schema:CustomerInsightSchema }
    ]),
    jwtConfig,
  ],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    CustomerTagService,
    TagService,
    CustomerInsightService,
    AuthService,
    RolePermissionService,
    StoreService,
    AppointmentService,
    StoreAvailabilityService,
    GlobalConfigService,
    AppointmentService,
    AdminConfigService,
    GoldLoanService,
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
  ],
})
export class CustomerModule {}

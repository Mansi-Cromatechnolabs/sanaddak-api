import { Module } from '@nestjs/common';
import { AgreementTemplateController } from './agreement_template.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AgreementTemplate,
  AgreementTemplateSchema,
} from './schema/agreement_template.schema';
import { AgreementTemplateService } from './agreement_template.service';
import { AuthService } from '../auth/auth.service';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '../auth/guard/auth.guard';
import { MasterUser, MasterUserSchema } from '../user/master-user.schema';
import { Tanant, TanantSchema } from '../user/tanant.schema';
import { StoreHolidayService } from '../appointment/services/store_holiday.service';
import { TanantUser, TanantUserSchema } from '../user/tanant-user.schema';
import { Customer, CustomerSchema } from 'src/customer/schema/customer.schema';
import { CustomerService } from 'src/customer/service/customer.service';
import { CustomerTagService } from 'src/customer/service/customer_tag.service';
import { TagService } from '../gold_loan/tag.service';
import { RolePermissionService } from '../role-permission/role-permission.service';
import { StoreService } from '../store/store.service';
import { AppointmentService } from '../appointment/services/appointment.service';
import { StoreAvailabilityService } from '../appointment/services/store_availability.service';
import { GoldLoanService } from '../gold_loan/gold_loan.service';
import { GlobalConfigService } from '../global_config/global_config.service';
import { AdminConfigService } from '../gold_loan/price_config.service';
import { LoanService } from '../loan/service/loan.service';
import { LoanPaymentTransactionService } from '../loan_payment_transaction/loan_payment_transaction.service';
import { ApplicationStatusService } from '../appointment/services/application_status.service';
import { NotificationTemplateService } from '../notification_template/notification_template.service';
import { CustomerNotificationService } from '../notification/notification.service';
import { StaffNotificationsService } from '../staff_notifications/staff_notifications.service';
import { LoanInstallmentService } from '../loan/service/loan_emi.service';
import { GoldItemService } from '../loan/service/gold_item.service';
import { EmailTemplateService } from '../email_template/email_template.service';
import { BarcodeService } from '../loan/service/barcode.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgreementTemplate.name, schema: AgreementTemplateSchema },
      { name: TanantUser.name, schema: TanantUserSchema },
      { name: MasterUser.name, schema: MasterUserSchema },
      { name: Tanant.name, schema: TanantSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [AgreementTemplateController],
  providers: [
    AgreementTemplateService,
    AuthService,
    CustomerService,
    CustomerTagService,
    TagService,
    RolePermissionService,
    StoreService,
    AppointmentService,
    StoreAvailabilityService,
    CustomerService,
    GoldLoanService,
    GlobalConfigService,
    CustomerTagService,
    TagService,
    AdminConfigService,
    LoanService,
    LoanPaymentTransactionService,
    ApplicationStatusService,
    NotificationTemplateService,
    CustomerNotificationService,
    StaffNotificationsService,
    GoldItemService,
    LoanInstallmentService,
    EmailTemplateService,
    BarcodeService,
  ],
})
export class AgreementTemplateModule {}

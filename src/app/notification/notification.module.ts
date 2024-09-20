import { Module } from '@nestjs/common';
import { CustomerNotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CustomerNotification,
  CustomerNotificationSchema,
} from './schema/customer_notification.schema';
import { CustomerNotificationService } from './notification.service';
import { NotificationTemplateService } from '../notification_template/notification_template.service';
import { CustomerService } from 'src/customer/service/customer.service';
import { CustomerTagService } from 'src/customer/service/customer_tag.service';
import { TagService } from '../gold_loan/tag.service';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { GoldLoanService } from '../gold_loan/gold_loan.service';
import { GlobalConfigService } from '../global_config/global_config.service';
import { AdminConfigService } from '../gold_loan/price_config.service';
import { AppointmentService } from '../appointment/services/appointment.service';
import { AgreementTemplateService } from '../agreement_template/agreement_template.service';
import { AuthService } from '../auth/auth.service';
import { StoreAvailabilityService } from '../appointment/services/store_availability.service';
import { ApplicationStatusService } from '../appointment/services/application_status.service';
import { StoreService } from '../store/store.service';
import { LoanService } from '../loan/service/loan.service';
import { TanantUser, TanantUserSchema } from '../user/tanant-user.schema';
import { MasterUser, MasterUserSchema } from '../user/master-user.schema';
import { Tanant, TanantSchema } from '../user/tanant.schema';
import { RolePermissionService } from '../role-permission/role-permission.service';
import { StaffNotificationsService } from '../staff_notifications/staff_notifications.service';
import { LoanPaymentTransactionService } from '../loan_payment_transaction/loan_payment_transaction.service';
import { GoldItemService } from '../loan/service/gold_item.service';
import { LoanInstallmentService } from '../loan/service/loan_emi.service';
import { EmailTemplateService } from '../email_template/email_template.service';
import { BarcodeService } from '../loan/service/barcode.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomerNotification.name, schema: CustomerNotificationSchema },
      { name: TanantUser.name, schema: TanantUserSchema },
      { name: MasterUser.name, schema: MasterUserSchema },
      { name: Tanant.name, schema: TanantSchema },
    ]),
  ],
  controllers: [CustomerNotificationController],
  providers: [
    CustomerNotificationService,
    CustomerService,
    NotificationTemplateService,
    CustomerTagService,
    TagService,
    ConfigService,
    GoldLoanService,
    GlobalConfigService,
    AdminConfigService,
    AppointmentService,
    AgreementTemplateService,
    AuthService,
    StoreAvailabilityService,
    ApplicationStatusService,
    StoreService,
    LoanService,
    RolePermissionService,
    StoreService,
    StaffNotificationsService,
    LoanPaymentTransactionService,
    GoldItemService,
    LoanInstallmentService,
    EmailTemplateService,
    BarcodeService,
  ],
})
export class CustomerNotificationModule {}

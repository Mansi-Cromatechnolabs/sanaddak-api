import { Module } from '@nestjs/common';
import { StaffNotificationsService } from './staff_notifications.service';
import { StaffNotificationsController } from './staff_notifications.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StaffNotification,
  StaffNotificationSchema,
} from './schema/staff_notifications.schema';
import { AuthService } from '../auth/auth.service';
import { NotificationTemplateService } from '../notification_template/notification_template.service';
import { MasterUser, MasterUserSchema } from '../user/master-user.schema';
import { Tanant, TanantSchema } from '../user/tanant.schema';
import { RolePermissionService } from '../role-permission/role-permission.service';
import { StoreService } from '../store/store.service';
import { AppointmentService } from '../appointment/services/appointment.service';
import { StoreAvailabilityService } from '../appointment/services/store_availability.service';
import { CustomerService } from 'src/customer/service/customer.service';
import { GoldLoanService } from '../gold_loan/gold_loan.service';
import { LoanService } from '../loan/service/loan.service';
import { LoanPaymentTransactionService } from '../loan_payment_transaction/loan_payment_transaction.service';
import { ApplicationStatusService } from '../appointment/services/application_status.service';
import { CustomerNotificationService } from '../notification/notification.service';
import { AgreementTemplateService } from '../agreement_template/agreement_template.service';
import { GlobalConfigService } from '../global_config/global_config.service';
import { CustomerTagService } from 'src/customer/service/customer_tag.service';
import { TagService } from '../gold_loan/tag.service';
import { AdminConfigService } from '../gold_loan/price_config.service';
import { GoldItemService } from '../loan/service/gold_item.service';
import { LoanInstallmentService } from '../loan/service/loan_emi.service';
import { EmailTemplateService } from '../email_template/email_template.service';
import { BarcodeService } from '../loan/service/barcode.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StaffNotification.name, schema: StaffNotificationSchema },
      { name: MasterUser.name, schema: MasterUserSchema },
      { name: Tanant.name, schema: TanantSchema },
    ]),
  ],
  providers: [
    StaffNotificationsService,
    AuthService,
    NotificationTemplateService,
    RolePermissionService,
    StoreService,
    AppointmentService,
    StoreAvailabilityService,
    CustomerService,
    GoldLoanService,
    LoanService,
    LoanPaymentTransactionService,
    ApplicationStatusService,
    CustomerNotificationService,
    AgreementTemplateService,
    GlobalConfigService,
    CustomerTagService,
    TagService,
    AdminConfigService,
    GoldItemService,
    LoanInstallmentService,
    EmailTemplateService, 
    BarcodeService,
  ],
  controllers: [StaffNotificationsController],
})
export class StaffNotificationsModule {}

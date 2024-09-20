import { Module } from '@nestjs/common';
import { LoanPaymentTransactionService } from './loan_payment_transaction.service';
import { LoanPaymentTransactionController } from './loan_payment_transaction.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { LoanPaymentTransaction, LoanPaymentTransactionSchema } from './schema/loan_payment_transaction.schema';
import { GoldLoanService } from '../gold_loan/gold_loan.service';
import { CustomerService } from 'src/customer/service/customer.service';
import { AdminConfigService } from '../gold_loan/price_config.service';
import { AppointmentService } from '../appointment/services/appointment.service';
import { CustomerTagService } from 'src/customer/service/customer_tag.service';
import { TagService } from '../gold_loan/tag.service';
import { GlobalConfigService } from '../global_config/global_config.service';
import { StoreAvailabilityService } from '../appointment/services/store_availability.service';
import { StoreService } from '../store/store.service';
import { LoanService } from '../loan/service/loan.service';
import { AuthService } from '../auth/auth.service';
import { RolePermissionService } from '../role-permission/role-permission.service';
import { MasterUser, MasterUserSchema } from '../user/master-user.schema';
import { Tanant, TanantSchema } from '../user/tanant.schema';
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
      {
        name: LoanPaymentTransaction.name,
        schema: LoanPaymentTransactionSchema,
      },
      { name: MasterUser.name, schema: MasterUserSchema },
      { name: Tanant.name, schema: TanantSchema },
    ]),
  ],
  providers: [
    LoanPaymentTransactionService,
    GoldLoanService,
    CustomerService,
    AdminConfigService,
    AppointmentService,
    CustomerTagService,
    TagService,
    GlobalConfigService,
    StoreAvailabilityService,
    StoreService,
    LoanService,
    AuthService,
    RolePermissionService,
    ApplicationStatusService,
    NotificationTemplateService,
    CustomerNotificationService,
    AgreementTemplateService,
    StaffNotificationsService,
    GoldItemService,
    LoanInstallmentService,
    EmailTemplateService,
    BarcodeService,
  ],
  controllers: [LoanPaymentTransactionController],
})
export class LoanPaymentTransactionModule {}

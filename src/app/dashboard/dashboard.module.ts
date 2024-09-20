import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from '../auth/auth.service';
import { MasterUser, MasterUserSchema } from '../user/master-user.schema';
import { TanantUser, TanantUserSchema } from '../user/tanant-user.schema';
import { Tanant, TanantSchema } from '../user/tanant.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { jwtConfig } from 'src/config/jwt.config';
import { RolePermissionService } from '../role-permission/role-permission.service';
import { StoreService } from '../store/store.service';
import { AppointmentService } from '../appointment/services/appointment.service';
import { StoreAvailabilityService } from '../appointment/services/store_availability.service';
import { CustomerService } from 'src/customer/service/customer.service';
import { GoldLoanService } from '../gold_loan/gold_loan.service';
import { GlobalConfigService } from '../global_config/global_config.service';
import { CustomerTagService } from 'src/customer/service/customer_tag.service';
import { TagService } from '../gold_loan/tag.service';
import { AdminConfigService } from '../gold_loan/price_config.service';
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
    jwtConfig,
    MongooseModule.forFeature([
      { name: TanantUser.name, schema: TanantUserSchema },
      { name: MasterUser.name, schema: MasterUserSchema },
      { name: Tanant.name, schema: TanantSchema },
    ]),
  ],
  providers: [
    DashboardService,
    AuthService,
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
    AgreementTemplateService,
    StaffNotificationsService,
    GoldItemService,
    LoanInstallmentService,
    EmailTemplateService,
    BarcodeService,
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}

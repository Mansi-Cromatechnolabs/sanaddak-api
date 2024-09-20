import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { jwtConfig } from 'src/config/jwt.config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AuthGuard } from 'src/app/auth/guard/auth.guard';
import { StoreHolidayService } from './services/store_holiday.service';
import { StoreAvailabilityService } from './services/store_availability.service';
import { GlobalConfigService } from '../global_config/global_config.service';
import { StoreService } from '../store/store.service';
import { AppointmentService } from './services/appointment.service';
import { CustomerService } from 'src/customer/service/customer.service';
import { CustomerTagService } from 'src/customer/service/customer_tag.service';
import { TagService } from '../gold_loan/tag.service';
import { GoldLoanService } from '../gold_loan/gold_loan.service';
import { AdminConfigService } from '../gold_loan/price_config.service';
import { AuthService } from '../auth/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MasterUser, MasterUserSchema } from '../user/master-user.schema';
import { Tanant, TanantSchema } from '../user/tanant.schema';
import { RolePermissionService } from '../role-permission/role-permission.service';
import { LoanService } from '../loan/service/loan.service';
import { LoanPaymentTransactionService } from '../loan_payment_transaction/loan_payment_transaction.service';
import { ApplicationStatusService } from './services/application_status.service';
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
      { name: MasterUser.name, schema: MasterUserSchema },
      { name: Tanant.name, schema: TanantSchema },
    ]),
    jwtConfig,
  ],
  controllers: [AppointmentController],
  providers: [
    StoreHolidayService,
    StoreAvailabilityService,
    StoreService,
    AppointmentService,
    GlobalConfigService,
    CustomerService,
    CustomerTagService,
    TagService,
    GoldLoanService,
    AdminConfigService,
    AuthService,
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
export class AppointmentModule {}

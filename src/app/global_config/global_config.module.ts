import { Module } from '@nestjs/common';
import { GlobalConfigService } from './global_config.service';
import { GlobalModuleController } from './global_config.controller';
import { jwtConfig } from 'src/config/jwt.config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AuthGuard } from 'src/app/auth/guard/auth.guard';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GlobalConfig,
  GlobalConfigSchema,
} from './schema/global_config.schema';
import { AuthService } from '../auth/auth.service';
import { MasterUser, MasterUserSchema } from '../user/master-user.schema';
import { Tanant, TanantSchema } from '../user/tanant.schema';
import { RolePermissionService } from '../role-permission/role-permission.service';
import { StoreService } from '../store/store.service';
import { AppointmentService } from '../appointment/services/appointment.service';
import { StoreAvailabilityService } from '../appointment/services/store_availability.service';
import { CustomerService } from 'src/customer/service/customer.service';
import { CustomerTagService } from 'src/customer/service/customer_tag.service';
import { TagService } from '../gold_loan/tag.service';
import { GoldLoanService } from '../gold_loan/gold_loan.service';
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
    MongooseModule.forFeature([
      { name: GlobalConfig.name, schema: GlobalConfigSchema },
      { name: MasterUser.name, schema: MasterUserSchema },
      { name: Tanant.name, schema: TanantSchema },
    ]),
    jwtConfig,
  ],
  controllers: [GlobalModuleController],
  providers: [
    GlobalConfigService,
    AuthService,
    RolePermissionService,
    StoreService,
    CustomerService,
    TagService,
    GoldLoanService,
    AdminConfigService,
    CustomerTagService,
    AppointmentService,
    StoreAvailabilityService,
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
export class GlobalConfigModule {}

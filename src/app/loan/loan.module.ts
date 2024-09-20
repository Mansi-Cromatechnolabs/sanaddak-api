import { Module } from '@nestjs/common';
import { LoanController } from './loan.controller';
import { GoldLoanService } from 'src/app/gold_loan/gold_loan.service';
import { MongooseModule } from '@nestjs/mongoose';
import { jwtConfig } from 'src/config/jwt.config';
import { Customer, CustomerSchema } from 'src/customer/schema/customer.schema';
import { JwtService } from '@nestjs/jwt';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AuthGuard } from 'src/app/auth/guard/auth.guard';
import { CustomerTagService } from 'src/customer/service/customer_tag.service';
import { TagService } from 'src/app/gold_loan/tag.service';
import { AdminConfigService } from 'src/app/gold_loan/price_config.service';
import { AppointmentService } from 'src/app/appointment/services/appointment.service';
import { CustomerService } from 'src/customer/service/customer.service';
import { StoreAvailabilityService } from 'src/app/appointment/services/store_availability.service';
import { StoreService } from 'src/app/store/store.service';
import { GlobalConfigService } from 'src/app/global_config/global_config.service';
import { LoanService } from './service/loan.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../auth/auth.service';
import { MasterUser, MasterUserSchema } from '../user/master-user.schema';
import { Tanant, TanantSchema } from '../user/tanant.schema';
import { RolePermissionService } from '../role-permission/role-permission.service';
import { LoanPaymentTransactionService } from '../loan_payment_transaction/loan_payment_transaction.service';
import { ApplicationStatusService } from '../appointment/services/application_status.service';
import { NotificationTemplateService } from '../notification_template/notification_template.service';
import { CustomerNotificationService } from '../notification/notification.service';
import { AgreementTemplateService } from '../agreement_template/agreement_template.service';
import { StaffNotificationsService } from '../staff_notifications/staff_notifications.service';
import { GoldItemService } from './service/gold_item.service';
import { LoanInstallmentService } from './service/loan_emi.service';
import { BarcodeService } from './service/barcode.service';
import { EmailTemplateService } from '../email_template/email_template.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: () => ({
        storage: diskStorage({
          destination: '../../../uploads/gold_items',
          filename: (req, file, callback) => {
            const fileExtName = extname(file.originalname);
            callback(null, `${uuidv4()}${fileExtName}`);
          },
        }),
      }),
    }),
    MongooseModule.forFeature([
      { name: MasterUser.name, schema: MasterUserSchema },
      { name: Tanant.name, schema: TanantSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
    jwtConfig,
  ],
  controllers: [LoanController],
  providers: [
    LoanService,
    GoldItemService,
    LoanInstallmentService,
    JwtService,
    GoldLoanService,
    CustomerService,
    CustomerTagService,
    TagService,
    AdminConfigService,
    AppointmentService,
    StoreAvailabilityService,
    StoreService,
    GlobalConfigService,
    AuthService,
    RolePermissionService,
    LoanPaymentTransactionService,
    ApplicationStatusService,
    AuthService,
    RolePermissionService,
    LoanPaymentTransactionService,
    NotificationTemplateService,
    CustomerNotificationService,
    AgreementTemplateService,
    StaffNotificationsService,
    BarcodeService,
    EmailTemplateService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    Reflector,
  ],
})
export class LoanModule {}

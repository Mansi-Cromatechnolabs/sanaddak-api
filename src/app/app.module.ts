import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from '../config/app.config';
import { i18nConfig } from 'src/config/i18n.config';
import { I18nModule } from 'nestjs-i18n';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingModule } from './setting/setting.module';
import { MongoDbConnection } from 'src/utils/mongo-db-connection.util';
import { RolePermissionModule } from './role-permission/role-permission.module';
import { AppointmentModule } from './appointment/appointment.module';
import { GlobalConfigModule } from './global_config/global_config.module';
import { GoldLoanModule } from './gold_loan/gold_loan.module';
import { StoreModule } from './store/store.module';
import { UserModule } from './user/user.module';
import { CustomerModule } from 'src/customer/customer.module';
import { ContactUsModule } from './contectus/contextus.modeule';
import { DashboardModule } from './dashboard/dashboard.module';
import { StaffModule } from './staff/staff.module';
import { LoanModule } from './loan/loan.module';
import { CmsModule } from './cms/cms.module';
import { AgreementTemplateModule } from './agreement_template/agreement_template.module';
import { EventsModule } from 'src/app/events/events.module';
import { StaffDashboardModule } from './staff_dashboard/staff_dashboard.module';
import { CustomerNotificationModule } from './notification/notification.module';
import { StaffNotificationsModule } from './staff_notifications/staff_notifications.module';
import { EmailTemplateModule } from './email_template/email_template.module';
import { NotificationTemplateModule } from './notification_template/notification_template.module';
import { LoanPaymentTransactionModule } from './loan_payment_transaction/loan_payment_transaction.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../', 'uploads'),
      serveRoot: '/uploads',
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(appConfig),
    MongooseModule.forRoot(`${process.env.MONGO_URL}/${process.env.DB_NAME}?authSource=admin`, {
      autoIndex: false,
      autoCreate: false,
    }),
    I18nModule.forRoot(i18nConfig),
    SettingModule,
    AuthModule,
    RolePermissionModule,
    SettingModule,
    AuthModule,
    GoldLoanModule,
    AppointmentModule,
    StoreModule,
    GlobalConfigModule,
    UserModule,
    CustomerModule,
    ContactUsModule,
    DashboardModule,
    StaffModule,
    LoanModule,
    CmsModule,
    AgreementTemplateModule,
    EventsModule,
    StaffDashboardModule,
    CustomerNotificationModule,
    StaffNotificationsModule,
    EmailTemplateModule,
    NotificationTemplateModule,
    LoanPaymentTransactionModule,
  ],
  controllers: [AppController],
  providers: [AppService, MongoDbConnection],
})
export class AppModule {}

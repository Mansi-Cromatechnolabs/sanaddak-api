import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { SeederService } from './seeder.service';
import { UserSeeder } from './user.seeder';
import { RolePermissionModule } from '../role-permission/role-permission.module';
import { RolePermissionSeeder } from './role-permission.seeder';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from 'src/config/app.config';
import { UserAssignRoleSeeder } from './user-assign-role.seeder';
import { TagService } from '../gold_loan/tag.service';
import { GoldLoanModule } from '../gold_loan/gold_loan.module';
import { TagSeeder } from './tag.seeder';
import { CustomerTagService } from 'src/customer/service/customer_tag.service';
import { CmsService } from '../cms/cms.service';
import { CmsSeeder } from './cms.seeder';
import { AgreementTemplateSeeder } from './agreement_template.seeder';
import { EmailTemplateSeeder } from './email_template.seeder';
import { NotificationTemplateSeeder } from './notification_template.seeder';
import { GlobalConfigSeeder } from './globalconfigs.seeder';
import { PriceConfigSeeder } from './priceconfigs.seeder';

@Module({
    imports: [
        ConfigModule.forRoot(appConfig),
        MongooseModule.forRoot(`${process.env.MONGO_URL}/${process.env.DB_NAME}?authSource=admin`, {
            autoIndex: false,
            autoCreate: false,
            authSource: 'admin'
        }),
        UserModule,
        RolePermissionModule,
    ],
    providers: [SeederService, UserSeeder, RolePermissionSeeder, UserAssignRoleSeeder, CustomerTagService, TagService, TagSeeder, CmsService, CmsSeeder, AgreementTemplateSeeder, EmailTemplateSeeder, NotificationTemplateSeeder, GlobalConfigSeeder,PriceConfigSeeder]
})
export class SeederModule { }

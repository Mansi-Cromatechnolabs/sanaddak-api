import { Injectable } from '@nestjs/common';
import { UserSeeder } from './user.seeder';
import { RolePermissionSeeder } from './role-permission.seeder';
import { UserAssignRoleSeeder } from './user-assign-role.seeder';
import { TagSeeder } from './tag.seeder';
import { CmsSeeder } from './cms.seeder';
import { AgreementTemplateSeeder } from './agreement_template.seeder';
import { EmailTemplateSeeder } from './email_template.seeder';
import { NotificationTemplateSeeder } from './notification_template.seeder';
import { GlobalConfigSeeder } from './globalconfigs.seeder';
import { PriceConfigSeeder } from './priceconfigs.seeder';

@Injectable()
export class SeederService {
    constructor(
        private readonly userSeeder: UserSeeder,
        private readonly rolePermissionSeeder: RolePermissionSeeder,
        private readonly userAssignRoleSeeder: UserAssignRoleSeeder,
        private readonly addTagSeeder: TagSeeder,
        private readonly addCmsSeeder: CmsSeeder,
        private readonly addAgreementTemplateSeeder: AgreementTemplateSeeder,
        private readonly addEmailTemplateSeeder: EmailTemplateSeeder,
        private readonly addNotificationTemplateSeeder: NotificationTemplateSeeder,
        private readonly addGlobalConfigSeeder: GlobalConfigSeeder,
        private readonly addPriceConfigSeeder: PriceConfigSeeder,
    ) { }

    async seed() {
        await this.userSeeder.seed();
    }

    async tanantSeed(dbname) {
        await this.userSeeder.tenantSeed(dbname);
        await this.rolePermissionSeeder.tanantSeed(dbname);
        await this.userAssignRoleSeeder.seed(dbname);
        await this.addTagSeeder.seed(dbname)
        await this.addPriceConfigSeeder.seed(dbname)
        await this.addGlobalConfigSeeder.seed(dbname)
        await this.addCmsSeeder.seed(dbname)
        await this.addAgreementTemplateSeeder.seed(dbname)
        await this.addEmailTemplateSeeder.seed(dbname)
        await this.addNotificationTemplateSeeder.seed(dbname)
    }
}

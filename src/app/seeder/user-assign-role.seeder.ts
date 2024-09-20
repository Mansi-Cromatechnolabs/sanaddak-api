import { Injectable } from '@nestjs/common';
import { RolePermissionService } from '../role-permission/role-permission.service';
import { UserService } from '../user/user.service';

@Injectable()
export class UserAssignRoleSeeder {
    constructor(
        private readonly rolePermissionService: RolePermissionService,
        private readonly userService: UserService
    ) { }

    async seed(db_name: string) {
        let role = await this.rolePermissionService.getTanantRole('super-admin', db_name);
        let user = await this.userService.findTanantUserByEmail(db_name, process.env.DEFAULT_STAFF_EMAIL_4_SEEDER);
        if (role && user) {
            let rolePermission = await this.rolePermissionService.getAssignUserRole(user.id, role.id, db_name);
            if (!rolePermission) {
                await this.rolePermissionService.assignUserRole(user.id, role.id, db_name);
                console.log(`User: ${user.name} assigned to role: ${role.name}`); 
            }
        }
    }
}

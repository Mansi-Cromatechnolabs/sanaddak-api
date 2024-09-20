import { Injectable } from '@nestjs/common';
import { RolePermissionService } from '../role-permission/role-permission.service';

@Injectable()
export class RolePermissionSeeder {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  async tanantSeed(db_name: string) {
    const roles = ['super-admin', 'store-owner'];

    const allPermissions = [
      'liquidityApplicationProcess.calculator',
      'liquidityApplicationProcess.liquidityApplicationProcess',
      'transactionProcessingSystem.Below25kApprove',
      'transactionProcessingSystem.Above25kApprove',
      'customerPortfolio.view',
      'liquidityPortfolio.view',
      'liquidityPortfolio.penaltyWaive',
      'appointment.view',
      'appointment.appointmentBooking',
      'kyc.view',
      'kyc.approve',
      'store.view',
      'store.create',
      'store.update',
      'store.storeConfiguration',
      'customer.view',
      'customer.active',
      'customer.delete',
      'user.view',
      'user.create',
      'user.update',
      'user.delete',
      'role&Permissions.view',
      'role&Permissions.create',
      'role&Permissions.update',
      'role&Permissions.delete',
      'help&Support.view',
      'priceTag.maker',
      'priceTag.checker',
      'priceTag.approver',
      'priceTag.view',
      'priceTag.delete',
      'agreementTemplate.view',
      'agreementTemplate.update',
      'messageTemplate.view',
      'messageTemplate.update',
      'notificationTemplate.view',
      'notificationTemplate.update',
      'emailTemplate.view',
      'emailTemplate.update',
      'payment.view',
      'payment.makePayment',
      'scanBarcode.view',
      'scanBarcode.scanBarcode',
      'wareHouse.WarehouseManagement',
      'globalConfig.view',
      'globalConfig.update',
      'payment.view',
    ];

    const storeOwnerPermission = [
      'liquidityApplicationProcess.calculator',
      'liquidityApplicationProcess.liquidityApplicationProcess',
      'transactionProcessingSystem.view',
      'transactionProcessingSystem.Below25kApprove',
      'transactionProcessingSystem.Above25kApprove',
      'customerPortfolio.view',
      'liquidityPortfolio.view',
      'liquidityPortfolio.penaltyWaive',
      'appointment.view',
      'appointment.appointmentBooking',
      'kyc.view',
      'kyc.approve',
      'store.view',
      'store.update',
      'store.storeConfiguration',
      'customer.view',
      'customer.active',
      'customer.delete',
      'user.view',
      'user.create',
      'user.update',
      'user.delete',
      'role&Permissions.view',
      'help&Support.view',
      'priceTag.view',
      'agreementTemplate.view',
      'messageTemplate.view',
      'notificationTemplate.view',
      'emailTemplate.view',
      'payment.view',
      'payment.makePayment'
    ];

    for (const roleName of roles) {
      let role = await this.rolePermissionService.getTanantRole(
        roleName,
        db_name,
      );
      if (!role) {
        role = await this.rolePermissionService.tanantRoleCreate(
          roleName,
          db_name,
          true,
        );
        console.log(`Created role: ${role.name} with id: ${role.id}`);
        const permissions =
          roleName === 'super-admin' ? allPermissions : storeOwnerPermission;
        for (const permissionName of permissions) {
          let permission = await this.rolePermissionService.getTanantPermission(
            permissionName,
            db_name,
          );
          if (!permission) {
            permission =
              await this.rolePermissionService.tanantPermissionCreate(
                permissionName,
                db_name,
              );
            console.log(
              `Created permission: ${permission.name} with id: ${permission.id}`,
            );
          }
          let rolePermission =
            await this.rolePermissionService.getAssignRolePermission(
              permission.id,
              role.id,
              db_name,
            );
          if (!rolePermission) {
            await this.rolePermissionService.assignRolePermission(
              permission.id,
              role.id,
              db_name,
            );
            console.log(
              `Assigned permission: ${permission.name} to role: ${role.name}`,
            );
          }
        }
      }
    }
  }
}

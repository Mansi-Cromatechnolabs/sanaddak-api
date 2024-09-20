import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { Role, RoleSchema } from './schema/roles.schema';
import { Permission, PermissionSchema } from './schema/permissions.schema';
import {
  RolePermission,
  RolePermissionSchema,
} from './schema/role_permissions.schema';
import { UserRole, UserRoleSchema } from './schema/user_role.schema';
import { UpdateRoleDTO } from './dto/update-role.dto';
import { _404 } from 'src/utils/http-code.util';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';
import { ObjectId } from 'mongodb';

// @Injectable({ scope: Scope.REQUEST })
@Injectable()
export class RolePermissionService {
  public tanantRoleModel: Model<any>;
  public tanantPermissionModel: Model<any>;
  public rolePermissionModel: Model<any>;
  public userRoleModel: Model<any>;

  // constructor(
  //     // @InjectModel(MasterUser.name) private masterUserModel: Model<MasterUser>,
  //     // @InjectModel(Tanant.name) private tanantModel: Model<Tanant>
  // ) { }

  async getTanantRoles(db_name, is_admin) {
    this.tanantRoleModel = await setTanantConnection(
      db_name,
      'Role',
      RoleSchema,
    );

    let filter: any = { is_active: true, not_deletable: null };

    if (!is_admin) {
      filter.not_deletable = false;
    } else {
      delete filter.not_deletable;
    }

    const roles = await this.tanantRoleModel.find(filter).exec();
    return roles.map((role) => {
      return {
        id: role._id,
        name: role.name,
        is_active: role.is_active,
        not_deletable: role?.not_deletable,
      };
    });
  }

  async getRoleByName(
    db_name: string,
    role_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    try {
      this.tanantRoleModel = await setTanantConnection(
        db_name,
        'Role',
        RoleSchema,
      );

      const role = await this.tanantRoleModel
        .findOne({ name: role_name, is_active: true })
        .exec();
      return role;
    } catch (error) {
      throw new BadRequestException(i18n.t(`lang.auth.tanant.role_not_found`));
    }
  }

  async tanantRoleUpdate(
    db_name: string,
    updateRoleDTO: UpdateRoleDTO,
    i18n: I18nContext,
  ) {
    this.tanantRoleModel = await setTanantConnection(
      db_name,
      'Role',
      RoleSchema,
    );
    let role = await this.tanantRoleModel
      .findOne({ _id: updateRoleDTO.id })
      .exec();
    if (!role) {
      throw new NotFoundException({
        message: i18n.t(`lang.auth.tanant.role_not_found`),
        status: _404,
      });
    }
    return await this.tanantRoleModel
      .findByIdAndUpdate(updateRoleDTO.id, updateRoleDTO, { new: true })
      .exec();
  }

  async tanantRoleCreate(roleName, db_name, not_deletable) {
    this.tanantRoleModel = await setTanantConnection(
      db_name,
      'Role',
      RoleSchema,
    );
    const role = new this.tanantRoleModel({
      name: roleName,
      not_deletable: not_deletable,
    });
    let result = await role.save();
    return {
      id: result.id,
      name: result.name,
      is_active: result.is_active,
      not_deletable: result.not_deletable,
    };
  }

  async tanantRoleDelete(db_name, id: string, i18n: I18nContext) {
    this.tanantRoleModel = await setTanantConnection(
      db_name,
      'Role',
      RoleSchema,
    );
    this.userRoleModel = await setTanantConnection(
      db_name,
      UserRole.name,
      UserRoleSchema,
    );
    const user_role = await this.userRoleModel.find({ role_id: id });
    if (user_role.length > 0) {
      throw new NotFoundException({
        message: i18n.t(`lang.auth.tanant.role_not_delete`),
        status: _404,
      });
    }

    let role = await this.tanantRoleModel.findOne({ _id: id }).exec();
    if (!role) {
      throw new NotFoundException({
        message: i18n.t(`lang.auth.tanant.role_not_found`),
        status: _404,
      });
    }
    return await this.tanantRoleModel.findByIdAndDelete(id).exec();
  }

  async getTanantRole(roleName, db_name) {
    this.tanantRoleModel = await setTanantConnection(
      db_name,
      'Role',
      RoleSchema,
    );
    return await this.tanantRoleModel.findOne({ name: roleName }).exec();
  }

  async getTanantPermissions(db_name) {
    this.tanantPermissionModel = await setTanantConnection(
      db_name,
      'Permission',
      PermissionSchema,
    );
    const permissions = await this.tanantPermissionModel
      .find({ is_active: true })
      .exec();
    return permissions.map((permission) => {
      return {
        id: permission._id,
        name: permission.name,
        is_active: permission.is_active,
      };
    });
  }

  async tanantPermissionCreate(permissionName, db_name) {
    this.tanantPermissionModel = await setTanantConnection(
      db_name,
      'Permission',
      PermissionSchema,
    );
    const permission = new this.tanantPermissionModel({
      name: permissionName,
    });
    let result = await permission.save();

    return {
      id: result.id,
      name: result.name,
      is_active: result.is_active,
    };
  }
  async getRolePermissions(id, db_name) {
    this.tanantPermissionModel = await setTanantConnection(
      db_name,
      Permission.name,
      PermissionSchema,
    );
    this.tanantRoleModel = await setTanantConnection(
      db_name,
      Role.name,
      RoleSchema,
    );
    const role = await this.tanantRoleModel.findById(id);
    if (!role) {
      return { status: 404 };
    }
    const permission = await this.tanantPermissionModel.aggregate([
      {
        $lookup: {
          from: 'role_permissions',
          let: { permission_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$permission_id', '$$permission_id'] },
                role_id: id ? new ObjectId(id) : null,
              },
            },
          ],
          as: 'role_permissions',
        },
      },
      {
        $addFields: {
          is_enable: { $eq: [{ $size: '$role_permissions' }, 1] },
        },
      },
      {
        $project: {
          _id: 0,
          permissions: {
            _id: '$_id',
            name: '$name',
            is_active: '$is_active',
          },
          is_enable: 1,
        },
      },
    ]);

    return {
      id: role._id,
      role_name: role.name,
      permission,
      not_deletable: role?.not_deletable,
    };
  }
  async getPermissions(id, db_name) {
    this.rolePermissionModel = await setTanantConnection(
      db_name,
      RolePermission.name,
      RolePermissionSchema,
    );
    const permission = await this.rolePermissionModel.aggregate([
      {
        $lookup: {
          from: 'permissions',
          localField: 'permission_id',
          foreignField: '_id',
          as: 'permissions',
        },
      },
      {
        $unwind: {
          path: '$permissions',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          role_id: 1,
          name: 1,
          permissions: 1,
          is_enable: {
            $cond: {
              if: { $eq: ['$role_id', id ? id : ''] },
              then: true,
              else: false,
            },
          },
        },
      },
    ]);

    return permission;
  }

  async getTanantPermission(permissionName, db_name) {
    this.tanantPermissionModel = await setTanantConnection(
      db_name,
      'Permission',
      PermissionSchema,
    );
    return await this.tanantPermissionModel
      .findOne({ name: permissionName })
      .exec();
  }

  async assignRolePermission(permissionId, RoleId, db_name) {
    this.rolePermissionModel = await setTanantConnection(
      db_name,
      'RolePermission',
      RolePermissionSchema,
    );
    const rolePermission = new this.rolePermissionModel({
      role_id: RoleId,
      permission_id: permissionId,
    });
    let result = await rolePermission.save();

    return {
      id: result._id,
      role_id: result.role_id,
      permission_id: result.permission_id,
    };
  }

  async assignRolePermissions(permissionIds, roleId, db_name) {
    this.rolePermissionModel = await setTanantConnection(
      db_name,
      'RolePermission',
      RolePermissionSchema,
    );
    const rolePermissions = permissionIds.map((permission_id) => ({
      role_id: roleId,
      permission_id: permission_id,
    }));
    await this.rolePermissionModel.deleteMany({ role_id: roleId });
    const result = await this.rolePermissionModel.insertMany(rolePermissions);

    return result.map((res) => ({
      id: res._id,
      role_id: res.role_id,
      permission_id: res.permission_id,
    }));
  }

  async getAssignRolePermission(permissionId, RoleId, db_name) {
    this.rolePermissionModel = await setTanantConnection(
      db_name,
      'RolePermission',
      RolePermissionSchema,
    );
    return await this.rolePermissionModel
      .findOne({ role_id: RoleId, permission_id: permissionId })
      .exec();
  }

  async assignUserRole(userId, RoleId, db_name) {
    this.userRoleModel = await setTanantConnection(
      db_name,
      'UserRole',
      UserRoleSchema,
    );
    const rolePermission = new this.userRoleModel({
      user_id: userId,
      role_id: RoleId,
    });
    let result = await rolePermission.save();

    return {
      id: result._id,
      user_id: result.user_id,
      role_id: result.role_id,
    };
  }
  async getAssignUserRole(userId, RoleId, db_name) {
    this.userRoleModel = await setTanantConnection(
      db_name,
      'UserRole',
      UserRoleSchema,
    );
    return await this.userRoleModel
      .findOne({ user_id: userId, role_id: RoleId })
      .exec();
  }
  async getAssignUserRoleUpdate(userId, new_role_id, db_name) {
    this.userRoleModel = await setTanantConnection(
      db_name,
      'UserRole',
      UserRoleSchema,
    );
    return await this.userRoleModel
      .findOneAndUpdate(
        { user_id: userId },
        {
          $set: {
            role_id: new_role_id,
          },
        },
        { new: true },
      )
      .exec();
  }

  async updateUserRoles(
    user_id: string,
    role_ids: string[],
    db_name: string,
    i18n: I18nContext,
  ) {
    if (!Array.isArray(role_ids) || role_ids.length === 0) {
      throw new BadRequestException(i18n.t(`lang.auth.tanant.no_assign_role`));
    }
    this.userRoleModel = await setTanantConnection(
      db_name,
      'UserRole',
      UserRoleSchema,
    );
    await this.userRoleModel.deleteMany({ user_id: user_id });
    const rolePermissions = role_ids.map((roleId) =>
      new this.userRoleModel({
        user_id: user_id,
        role_id: roleId,
      }).save(),
    );

    const results = await Promise.all(rolePermissions);
    return results.map((result) => ({
      id: result._id,
      user_id: result.user_id,
      role_id: result.role_id,
    }));
  }
}

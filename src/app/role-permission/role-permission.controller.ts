import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolePermissionService } from './role-permission.service';
import { _200,_409 } from 'src/utils/http-code.util';
import { I18n, I18nContext } from 'nestjs-i18n';
import { errorResponse, PromiseResponse, successResponse } from 'src/utils/response.util';
import { CreateRoleDTO } from './dto/create-role.dto';
import { CreatePermissionAssignDTO } from './dto/create-permission-assign.dto';
import { CreateUserRoleAssignDTO } from './dto/create-user-role-assign.dto';
import { Permission } from 'src/decorators/permission.decorator';
import { UpdateRoleDTO } from './dto/update-role.dto';

@ApiTags('Role-Permission')
@Controller()
@ApiBearerAuth()
export class RolePermissionController {
    constructor(private readonly rolePermissionService: RolePermissionService) { }

    @Get('tanant/role/list')
    @Permission('role&Permissions.view')
    @ApiResponse({ status: _200, description: 'Roles getting successfully.' })
    async tanantRoles(@Request() req, @I18n() i18n: I18nContext): Promise<PromiseResponse> {
        try {
            let db_name = req.user.db_name;
            const roles = await this.rolePermissionService.getTanantRoles(db_name, req.user.is_admin);
            return successResponse(_200,i18n.t(`lang.auth.role.list`), roles);
        } catch (error) {
            errorResponse(error);
        }
    }

    @Post('tanant/role/create')
    @Permission('role&Permissions.create')
    @ApiResponse({ status: _200, description: 'Role created successfully.' })
    @ApiResponse({ status: _409, description: 'Role already exist.' })
    async tanantRoleCreate(@Request() req, @Body() createRoleDTO: CreateRoleDTO, @I18n() i18n: I18nContext): Promise<PromiseResponse> {
        try {
            let db_name = req.user.db_name;
            const roleExist = await this.rolePermissionService.getTanantRole(createRoleDTO.name, db_name);
            if (roleExist) {
                throw new BadRequestException(i18n.t(`lang.auth.role.exist`));
            }
            const role = await this.rolePermissionService.tanantRoleCreate(createRoleDTO.name, db_name, false);
            return successResponse(_200,i18n.t(`lang.auth.role.create`), role);
        } catch (error) {
            errorResponse(error);
        }
    }

    @Put('tanant/role/update')
    @Permission('role&Permissions.update')
    @ApiResponse({ status: _200, description: 'Role updated successfully.' })
    async tanantRoleUpdate(@Request() req, @Body() updateRoleDTO: UpdateRoleDTO, @I18n() i18n: I18nContext): PromiseResponse {
        try {
            let db_name = req.user.db_name;
            const data = await this.rolePermissionService.tanantRoleUpdate(db_name, updateRoleDTO, i18n);
            return successResponse(_200,i18n.t(`lang.auth.role.update`), data);
        } catch (error) {
            errorResponse(error);
        }
    }

    @Delete('tanant/role/delete/:id')
    @Permission('role&Permissions.delete')
    @ApiResponse({ status: _200, description: 'Role deleted successfully.' })
    async tanantRoleDelete(@Request() req, @Param('id') id: string, @I18n() i18n: I18nContext): PromiseResponse {
        try {
            let db_name = req.user.db_name;
            await this.rolePermissionService.tanantRoleDelete(db_name, id,i18n);
            return successResponse(_200,i18n.t(`lang.auth.role.delete`));
        } catch (error) {
            errorResponse(error);
        }
    }

    @Get('tanant/permission/list')
    @Permission('role&Permissions.view')
    @ApiResponse({ status: _200, description: 'Permissions getting successfully.' })
    async tanantPermissions(@Request() req, @I18n() i18n: I18nContext): Promise<PromiseResponse> {
        try {
            let db_name = req.user.db_name;
            const permissions = await this.rolePermissionService.getTanantPermissions(db_name);
            return successResponse(_200,i18n.t(`lang.auth.permission.view`), permissions);
        } catch (error) {
            errorResponse(error);
        }
    }

    @Post('assign/role/permission')
    @Permission('role&Permissions.create')
    @ApiResponse({ status: _200, description: 'Permission assign to role successfully.' })
    @ApiResponse({ status: _409, description: 'Permission already assigned.' })
    async assignRolePermission(@Request() req, @Body() createPermissionAssignDTO: CreatePermissionAssignDTO, @I18n() i18n: I18nContext): Promise<PromiseResponse> {
        try {
            let db_name = req.user.db_name;
            await this.rolePermissionService.assignRolePermissions(createPermissionAssignDTO.permission_ids, createPermissionAssignDTO.role_id, db_name);
            return successResponse(_200,i18n.t(`lang.auth.permission.created`));
        } catch (error) {
            errorResponse(error);
        }
    }
    @Post('role_permissions')
    @Permission('role&Permissions.view')
    @ApiResponse({ status: _200, description: 'Permission assign to role successfully.' })
    @ApiResponse({ status: _409, description: 'Permission already assigned.' })
    async RolePermissions(@Request() req, @Query("role_id") id:string, @I18n() i18n: I18nContext): Promise<PromiseResponse> {
        try {
            let db_name = req.user.db_name;
            const permission = await this.rolePermissionService.getRolePermissions(id,db_name);
            return successResponse(_200,i18n.t(`lang.auth.permission.view`),permission);
        } catch (error) {
            errorResponse(error);
        }
    }
    @Post('permissions')
    @Permission('role&Permissions.view')
    @ApiResponse({ status: _200, description: 'Permission assign to role successfully.' })
    @ApiResponse({ status: _409, description: 'Permission already assigned.' })
    async Permissions(@Request() req , @I18n() i18n: I18nContext): Promise<PromiseResponse> {
        try {
            let db_name = req.user.db_name;
            const permission = await this.rolePermissionService.getPermissions("",db_name);
            return successResponse(_200,i18n.t(`lang.auth.permission.view`),permission);
        } catch (error) {
            errorResponse(error);
        }
    }

    @Post('assign/user/role')
    @Permission('role&Permissions.view')
    @ApiResponse({ status: _200, description: 'User assign to role successfully.' })
    @ApiResponse({ status: _409, description: 'User role already assigned.' })
    async assignUserRole(@Request() req, @Body() createUserRoleAssignDTO: CreateUserRoleAssignDTO, @I18n() i18n: I18nContext): Promise<PromiseResponse> {
        try {
            let db_name = req.user.db_name;
            const assignUserRoleExist = await this.rolePermissionService.getAssignUserRole(createUserRoleAssignDTO.user_id, createUserRoleAssignDTO.role_id, db_name);
            if (assignUserRoleExist) {
                throw new BadRequestException(i18n.t(`lang.auth.user.asign`));
            }
            await this.rolePermissionService.assignUserRole(createUserRoleAssignDTO.user_id, createUserRoleAssignDTO.role_id, db_name);
            return successResponse(_200,i18n.t(`lang.auth.tanant.permission.created`));
        } catch (error) {
            errorResponse(error);
        }
    }
}

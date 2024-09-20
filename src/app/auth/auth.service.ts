import {
  BadRequestException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MasterUserRegistertDTO } from './dto/registration.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, UserLoginDto } from './dto/login.dto';
import {
  bcryptComparePassword,
  bcryptPassword,
  generateRandomString,
} from 'src/utils/helper';
import { snake_case } from 'src/utils/string.util';
import { InjectModel } from '@nestjs/mongoose';
import { MasterUser } from '../user/master-user.schema';
import { Tanant } from '../user/tanant.schema';
import mongoose, { Model } from 'mongoose';
import * as migrateMongo from 'migrate-mongo';
import * as path from 'path';
import { TanantUser, TanantUserSchema } from '../user/tanant-user.schema';
import {
  createMongoConnection,
  setTanantConnection,
} from 'src/utils/mongo-tanant-connection.util';
import { date_moment } from 'src/utils/date.util';
import { executeSeeder } from 'src/utils/mongo-db-connection.util';
import { UserRoleSchema } from '../role-permission/schema/user_role.schema';
import { RoleSchema } from '../role-permission/schema/roles.schema';
import {
  RolePermission,
  RolePermissionSchema,
} from '../role-permission/schema/role_permissions.schema';
import { PermissionSchema } from '../role-permission/schema/permissions.schema';
import { _300, _400, _401, _404 } from 'src/utils/http-code.util';
import { ObjectId } from 'mongodb';
import { UpdateStaffDTO } from './dto/staff.dto';
import { UserVerification, VerifyOtp } from './dto/verify.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forget-password.dto';
import { StaffChangePasswordDto } from './dto/change-password.dto';
import { RolePermissionService } from '../role-permission/role-permission.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { StoreService } from '../store/store.service';
import { createVerification } from 'src/utils/twillo.util';
import { sendEmail } from 'src/utils/sendgrid.util';
import { checkVerification } from 'src/utils/twillo.util';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';
import { GlobalConfigService } from '../global_config/global_config.service';
import { StaffNotificationsService } from '../staff_notifications/staff_notifications.service';
import { EmailTemplateService } from '../email_template/email_template.service';
const config = require('../../../migrate-mongo-config');

@Injectable()
export class AuthService {
  public tanantUserModel: Model<any>;
  public userRoleModel: Model<any>;
  public roleModel: Model<any>;
  public rolePermissionModel: Model<any>;
  public tanantPermissionModel: Model<any>;

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(MasterUser.name) private masterUserModel: Model<MasterUser>,
    @InjectModel(Tanant.name) private tanantModel: Model<Tanant>,
    @Inject(forwardRef(() => RolePermissionService))
    private readonly rolePermissionService: RolePermissionService,
    @Inject(forwardRef(() => StoreService))
    private readonly storeService: StoreService,
    @Inject(forwardRef(() => GlobalConfigService))
    private readonly configService: GlobalConfigService,
    @Inject(forwardRef(() => StaffNotificationsService))
    private readonly staffNotificationsService: StaffNotificationsService,
    @Inject(forwardRef(() => EmailTemplateService))
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  async createTanant(name): Promise<Tanant> {
    const subdomain = await snake_case(name);
    const db_name = 'tanant_' + subdomain + '_' + Date.now();

    const tanant = await new this.tanantModel({
      name: name,
      db_name: db_name,
      subdomain: subdomain,
    });

    return await tanant.save();
  }

  async existTanant(name): Promise<Tanant> {
    const subdomain = await snake_case(name);
    return await this.tanantModel
      .findOne({ subdomain: subdomain, is_active: true })
      .exec();
  }

  async createDatabase(dbName: string): Promise<void> {
    try {
      const client = await createMongoConnection();
      const db = client.db(dbName);
      migrateMongo.config.set({
        ...config,
        migrationsDir: path.join(__dirname, '../../', 'migrations', 'tanants'),
      });
      const { up } = migrateMongo;
      await up(db, client);
      console.log(`Database ${dbName} created successfully`);
      await executeSeeder(dbName);
      console.log(`${dbName} seeding successfully`);
    } catch (err) {
      console.error('Error creating database:', err);
    }
  }

  async masterUserRegistration(
    masterUserRegistertDTO: MasterUserRegistertDTO,
    i18n: I18nContext,
  ): Promise<any> {
    let tanant = await this.createTanant(masterUserRegistertDTO.franchise);
    await this.createDatabase(tanant.db_name);
    let data = await this.tanantUserRegistration(
      masterUserRegistertDTO,
      tanant.db_name,
      i18n,
    );
    let role = await this.getTanantRole('super-admin', tanant.db_name);
    await this.assignUserRole(data.id, role.id, tanant.db_name);
    return {
      ...data,
      tanant_id: tanant._id,
      db_name: tanant.db_name,
      subdomain: tanant.subdomain,
    };
  }

  async signIn(loginDto: LoginDto): Promise<object | boolean> {
    const user = await this.masterUserModel
      .findOne({ email: loginDto.email, is_active: true })
      .exec();

    if (
      user &&
      (await bcryptComparePassword(loginDto.password, user.password))
    ) {
      let data = {
        id: user._id,
        tanant_id: user.tanant_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.mobile_number,
        is_active: user.is_active,
      };
      const token = await this.generateToken(data);
      return {
        ...data,
        token: token,
      };
    }
    return false;
  }

  async tanantUserRegistration(
    masterUserRegistertDTO: MasterUserRegistertDTO,
    db_name: string,
    i18n: I18nContext,
  ) {
    this.tanantUserModel = await setTanantConnection(
      db_name,
      'User',
      TanantUserSchema,
    );

    if (masterUserRegistertDTO.staff_id) {
      const existingUser = await this.tanantUserModel.findOne({
        _id: masterUserRegistertDTO.staff_id,
        is_active: true,
      });

      if (!existingUser) {
        throw new NotFoundException(i18n.t(`lang.auth.login_credential_faild`));
      }

      const conflictUser = await this.tanantUserModel.findOne({
        $or: [
          { email: masterUserRegistertDTO.email.toLowerCase(), is_active: true },
          {
            mobile_number: masterUserRegistertDTO.mobile_number,
            is_active: true,
          },
        ],
        _id: { $ne: masterUserRegistertDTO.staff_id },
      });

      if (conflictUser) {
        throw new BadRequestException(i18n.t(`lang.auth.user_exists`));
      }

      const updatedUser = await this.tanantUserModel.findByIdAndUpdate(
        masterUserRegistertDTO.staff_id,
        {
          $set: {
            ...masterUserRegistertDTO,
            email: masterUserRegistertDTO.email.toLowerCase(),
            password: masterUserRegistertDTO.password
              ? await bcryptPassword(masterUserRegistertDTO.password)
              : existingUser.password,
          },
        },
        { new: true },
      );

      await this.rolePermissionService.updateUserRoles(
        updatedUser.id,
        masterUserRegistertDTO.role_id,
        db_name,
        i18n,
      );

      return {
        role_id: masterUserRegistertDTO.role_id,
        store_id: updatedUser?.store_id,
        franchise: updatedUser.franchise ? updatedUser.franchise : '',
        first_name: updatedUser?.first_name,
        last_name: updatedUser?.last_name,
        email: updatedUser?.email,
        mobile_number: updatedUser?.mobile_number,
        is_active: updatedUser?.is_active,
        is_admin: updatedUser?.is_admin,
        profile_image: updatedUser?.profile_image,
        id: updatedUser?.id,
      };
    } else {
      const existingUser = await this.tanantUserModel.findOne({
        $or: [
          { email: masterUserRegistertDTO.email.toLowerCase(), is_active: true },
          { mobile_number: masterUserRegistertDTO.mobile_number, is_active: true },
        ],
      });

      if (existingUser) {
        throw new BadRequestException(i18n.t(`lang.auth.user_exists`));
      }

      const generated_password = await generateRandomString();
      if (!masterUserRegistertDTO.is_admin) {
        masterUserRegistertDTO.is_admin = false;
      }
      const generate_agent_code = await generateRandomString();
      const { store_id, ...otherDTOFields } = masterUserRegistertDTO;
      const storeIdValue = store_id === "" ? null : store_id;
      const newUser = new this.tanantUserModel({
        ...otherDTOFields,
        email: masterUserRegistertDTO.email.toLowerCase(),
        store_id: storeIdValue, 
        password: await bcryptPassword(generated_password),  
        agent_code: generate_agent_code,
      });
      const result = await newUser.save();

      if (
        !masterUserRegistertDTO.role_id ||
        masterUserRegistertDTO.role_id.length === 0
      ) {
        throw new BadRequestException(
          i18n.t(`lang.auth.tanant.no_assign_role`),
        );
      }
      await Promise.all(
        masterUserRegistertDTO.role_id.map((roleId) =>
          this.rolePermissionService.assignUserRole(result.id, roleId, db_name),
        ),
      );

      const token = await this.generateToken(
        { ...result._doc, id: result._doc._id },
        [],
      );
      if (result?.email){
        const data={
          user_name: `${result?.first_name} ${result?.last_name}`,
          mobile_number:result?.mobile_number,
          email: result?.email,
          generated_password: generated_password
        }
        await this.emailTemplateService.sendEmail(result?.email, "generated_password", db_name, data);
      }

      return {
        store_id: result.store_id,
        franchise: result.franchise ? result.franchise : '',
        profile_image: result?.profile_image,
        first_name: result.first_name,
        last_name: result.last_name,
        email: result.email,
        mobile_number: result.mobile_number,
        is_active: result.is_active,
        is_admin: result?.is_admin,
        id: result.id,
        token,
      };
    }
  }

  async tanantUserLogin(
    loginDto: UserLoginDto,
    tanant,
    i18n: I18nContext,
  ): Promise<object | boolean> {
    let db_name = tanant.db_name;
    this.tanantUserModel = await setTanantConnection(
      db_name,
      'User',
      TanantUserSchema,
    );

    const { type, value, password } = loginDto;
    let user =
      type === 'phone'
        ? await this.findUser(value, db_name)
        : await this.getUserProfileByEmail(value.toLowerCase(), db_name);

    if (!user) {
      throw new NotFoundException(i18n.t(`lang.auth.login_credential_faild`));
    }
    let otp;
    if (type === 'email') {
      otp = await this.sendOtp(
        { type: 'email', value, is_active: true },
        db_name,
        i18n,
      );
    } else if (type === 'phone') {
      otp = await this.sendOtp(
        { type: 'phone', value, is_active: true },
        db_name,
        i18n,
      );
    } else {
      return false;
    }

    if (
      user &&
      (await bcryptComparePassword(loginDto.password, user.password))
    ) {
      this.userRoleModel = await setTanantConnection(
        db_name,
        'UserRole',
        UserRoleSchema,
      );

      const userRole = await this.userRoleModel
        .find({ user_id: user._id })
        .exec();

      if (!userRole) {
        throw new HttpException(
          { success: false, message: i18n.t(`lang.auth.role_not_asigned`) },
          _404,
        );
      }
      this.roleModel = await setTanantConnection(db_name, 'Role', RoleSchema);

      const userRoleIds = userRole.map((userRole) => userRole.role_id);
      const roles = await this.roleModel
        .find({ _id: { $in: userRoleIds } })
        .exec();

      const roleIds = roles.map((role) => role.id);
      let permissions = await this.getRolePermissions(roleIds, db_name);

      let permissionIds = await permissions.map((permission) => {
        return permission.permission_id;
      });
      let rolePermission = await this.getUserRolePermissions(
        db_name,
        permissionIds,
      );
      let rolePermissionArray = rolePermission.map((permission) => {
        return permission.name;
      });

      const store_data = await this.storeService.getStoreDetails(
        user?.store_id,
        db_name,
      );

      const data = {
        id: user.id,
        tanant_id: tanant ? tanant.id : user.tanant_id,
        first_name: user.first_name,
        last_name: user.last_name,
        country_code: user.country_code,
        mobile_number: user.mobile_number,
        email: user.email,
        is_active: user.is_active,
        is_admin: user.is_admin,
        role_name: roles.map((role) => role.name),
        type: type,
        permissions: rolePermission,
        store_id: user?.store_id,
      };
      const token = await this.generateToken(data, rolePermissionArray, tanant);

      await this.tanantUserModel.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            fcm_token: loginDto?.fcm_token,
            token: token,
          },
        },
        { new: true },
      );
      const configGlobalDate = await this.configService.getGlobalConfig(
        {
          key: 'global_date_time_format',
        },
        db_name,
        i18n,
      );

      return {
        ...data,
        type: type,
        profile_image: user?.profile_image || '',
        store_name: store_data.name,
        store_address: store_data.address,
        store_location: store_data.location,
        global_date_format: configGlobalDate || '',
        token: token,
      };
    } else {
      throw new BadRequestException(i18n.t(`lang.auth.invalid_password`));
    }
  }

  async getUserPermissions(
    user_id: string,
    permission: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.userRoleModel = await setTanantConnection(
      db_name,
      'UserRole',
      UserRoleSchema,
    );
    this.roleModel = await setTanantConnection(db_name, 'Role', RoleSchema);

    const userRole = await this.userRoleModel.find({ user_id: user_id }).exec();

    if (!userRole) {
      throw new HttpException(
        { success: false, message: i18n.t(`lang.auth.role_not_asigned`) },
        _404,
      );
    }

    const userRoleIds = userRole.map((userRole) => userRole.role_id);
    const roles = await this.roleModel
      .find({ _id: { $in: userRoleIds } })
      .exec();

    const roleIds = roles.map((role) => role.id);
    let permissions = await this.getRolePermissions(roleIds, db_name);

    let permissionIds = await permissions.map((permission) => {
      return permission.permission_id;
    });
    let rolePermission = await this.getUserRolePermissions(
      db_name,
      permissionIds,
    );
    let rolePermissionArray = rolePermission.map((permission) => {
      return permission.name;
    });
    const hasPermission = rolePermissionArray.includes(permission);
    return hasPermission;
  }

  async findUser(phone: string, db_name: string): Promise<any> {
    this.tanantUserModel = setTanantConnection(
      db_name,
      TanantUser.name,
      TanantUserSchema,
    );

    const formattedPhoneNumber = phone.replace(' ', '');

    const user = await this.tanantUserModel
      .findOne({
        $or: [
          { mobile_number: phone, is_active: true, is_deleted: false },
          {
            $expr: {
              $eq: [
                { $concat: ['$country_code', '$mobile_number'] },
                `+${phone}`,
              ],
            },
            is_active: true,
            is_deleted: false,
          },
          {
            $expr: {
              $eq: [
                { $concat: ['$country_code', '$mobile_number'] },
                `${phone}`,
              ],
            },
            is_active: true,
            is_deleted: false,
          },
          {
            $expr: {
              $eq: [
                { $concat: ['$country_code', '$mobile_number'] },
                `+${formattedPhoneNumber}`,
              ],
            },
            is_active: true,
            is_deleted: false,
          },
          {
            $expr: {
              $eq: [
                { $concat: ['$country_code', '$mobile_number'] },
                `${formattedPhoneNumber}`,
              ],
            },
            is_active: true,
            is_deleted: false,
          },
        ],
      })
      .exec();
    return user;
  }

  async sendOtp(
    userVerification: UserVerification,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    const { type, value, is_active } = userVerification;
    const user =
      type === 'phone'
        ? await this.findUser(value, db_name)
        : await this.getUserProfileByEmail(value.toLowerCase(), db_name);
    if (user) {
      if (!user.is_active) {
        throw new BadRequestException(i18n.t(`lang.auth.inactive_account`));
      } else if (!is_active) {
        throw new BadRequestException(
          i18n.t(`lang.auth.user_already_registered`),
        );
      }
    } else if (is_active === true) {
      throw new BadRequestException(i18n.t(`lang.auth.user_not_found`));
    }
    if (type === 'phone') {
      const phoneNumber = user
        ? `${user.country_code}${user.mobile_number}`
        : value;
      // const otpResponse = await createVerification('sms',phoneNumber);

      // if (otpResponse.message === 'Failed to send OTP') {
      //   throw new BadRequestException({
      //     message: 'Failed to send OTP.',
      //     status: _400,
      //   });
      // }

      return { value: phoneNumber };
    }
    if (type === 'email') {
      // const otpResponse = await createVerification('email', value);

      // if (otpResponse.message === 'Failed to send OTP') {
      //   throw new BadRequestException({
      //     message: 'Failed to send OTP.',
      //     status: _400,
      //   });
      // }
      return { value: value.toLowerCase() };
    }
    return { value: value };
  }

  async verifyOtp(
    verifyOtp: VerifyOtp,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.tanantUserModel = setTanantConnection(
      db_name,
      TanantUser.name,
      TanantUserSchema,
    );

    const { type, value, otp } = verifyOtp;
    const customer =
      type === 'phone'
        ? await this.findUser(value, db_name)
        : await this.getUserProfileByEmail(value.toLowerCase(), db_name);

    if (type === 'email') {
      // const otpResponse = await createVerification('email', value);

      // if (otpResponse.message === 'Failed to send OTP') {
      //   throw new BadRequestException({
      //     message: 'Failed to send OTP.',
      //     status: _400,
      //   });
      // }
      if (customer) {
        customer.is_email_verified = true;
        await customer.save();
      }
    } else if (type === 'phone') {
      const phoneNumber = customer
        ? `${customer.country_code}${customer.mobile_number}`
        : value;
      // const otpStatus = await checkVerification(otp, phoneNumber);
      // if (otpStatus?.status === 'failed') {
      //   throw new NotFoundException({
      //     message: 'Invalid OTP.',
      //     status: _400,
      //   });
      // }
      if (customer) {
        customer.is_mobile_number_verified = true;
        await customer.save();
      }
    }

    return {
      data: { type },
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    const { type, value } = forgotPasswordDto;
    let user;

    user =
      type == 'phone'
        ? await this.findUser(value, db_name)
      : await this.getUserProfileByEmail(value.toLowerCase(), db_name);

    if (!user) {
      throw new BadRequestException(i18n.t(`lang.auth.invalid_email_phone`));
    }
    if (user.is_active === false) {
      throw new BadRequestException(i18n.t(`lang.auth.inactive_account`));
    }

    let otp;
    if (type == 'phone') {
      otp = await this.sendOtp({ type, value, is_active: true }, db_name, i18n);
      return {
        user_id: user.id,
        type,
        value: `${user.country_code}${user.mobile_number}`,
      };
    } else if (type == 'email') {
      otp = await this.sendOtp({ type, value, is_active: true }, db_name, i18n);
      return {
        user_id: user.id,
        type,
        value: user.email,
      };
    }
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.tanantUserModel = setTanantConnection(
      db_name,
      TanantUser.name,
      TanantUserSchema,
    );
    const { user_id, new_password } = resetPasswordDto;
    this.tanantUserModel = setTanantConnection(
      db_name,
      TanantUser.name,
      TanantUserSchema,
    );
    const user = await this.tanantUserModel.findById(user_id).exec();

    if (!user) {
      throw new NotFoundException(i18n.t(`lang.auth.no_user`));
    }
    user.password = await bcryptPassword(new_password);
    await user.save();

    await this.staffNotificationsService.sendPushNotification(
      user_id,
      'staff_side_reset_password',
      'notification',
      1,
      db_name,
      user_id,
    );

    return {
      message: i18n.t(`lang.auth.change_password_success`),
      data: {},
    };
  }

  async changePassword(
    id: string,
    changePasswordDto: StaffChangePasswordDto,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    const { old_password, new_password } = changePasswordDto;

    this.tanantUserModel = setTanantConnection(
      db_name,
      TanantUser.name,
      TanantUserSchema,
    );

    const user = await this.tanantUserModel.findOne({ _id: id }).exec();
    if (!user) {
      throw new NotFoundException(i18n.t(`lang.auth.not_found`));
    }

    const isMatch = await bcryptComparePassword(old_password, user.password);
    if (!isMatch) {
      throw new BadRequestException(i18n.t(`lang.auth.invalid_old_password`));
    }

    const newHashedPassword = await bcryptPassword(new_password);
    user.password = newHashedPassword;
    await user.save();
    return {
      message: i18n.t(`lang.auth.change_password_success`),
      data: {},
    };
  }

  async generateToken(
    payload,
    permissions = [],
    tanant = null,
  ): Promise<string> {
    console.log({
      ...payload,
      db_name: tanant ? tanant.db_name : null,
      permissions: permissions,
    });

    return this.jwtService.signAsync({
      ...payload,
      db_name: tanant ? tanant.db_name : null,
      permissions: permissions,
    });
  }

  async getUserProfile(id: string, db_name: string): Promise<any> {
    this.tanantUserModel = setTanantConnection(
      db_name,
      TanantUser.name,
      TanantUserSchema,
    );

    let user;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await this.tanantUserModel.findById({ _id: id }).exec();
    }
    return user ? user : false;
  }

  async getUserProfileByEmail(email: string, db_name: string): Promise<any> {
    this.tanantUserModel = setTanantConnection(
      db_name,
      TanantUser.name,
      TanantUserSchema,
    );

    const user = await this.tanantUserModel
      .findOne({ email, is_active: true })
      .exec();

    return user;
  }
  async getUserByEmail(email: string): Promise<MasterUser | null> {
    return await this.masterUserModel
      .findOne({ email: email })
      .select(['id', 'tanant_id', 'name', 'email', 'phone', 'is_active'])
      .exec();
  }

  async getTanant(tanant: string): Promise<Tanant | null> {
    return await this.tanantModel.findOne({ db_name: tanant }).exec();
  }

  async getTanantById(id): Promise<Tanant | null> {
    return await this.tanantModel.findOne({ _id: id }).exec();
  }

  async getTanantBySubdomain(
    subdomain: string,
    isActive: boolean = false,
  ): Promise<Tanant | null> {
    const fields: any = { subdomain: subdomain, deleted_at: null };
    if (isActive) {
      fields['is_active'] = true;
    }
    return await this.tanantModel.findOne(fields).exec();
  }

  async deleteTanant(subdomain: string): Promise<Tanant | null> {
    return await this.tanantModel
      .findOneAndUpdate(
        { subdomain: subdomain, deleted_at: null },
        { deleted_at: date_moment() },
        { new: true },
      )
      .exec();
  }

  async deleteExistingDbs() {
    try {
      let dbs = [
        'tanant_amit_1719854419491',
        'tanant_jhon_doe_1719854296940',
        'tanant_user_1719854263622',
      ];
      const client = await createMongoConnection();
      for (const dbNamee of dbs) {
        const db = await client.db(dbNamee);
        const result = await db.dropDatabase();
        if (result) {
          console.log(`Database ${dbNamee} deleted successfully`);
        } else {
          console.log(`Failed to delete database ${dbNamee}`);
        }
      }
    } catch (err) {
      console.error('Error creating database:', err);
    }
  }

  async updateTanantStatus(
    subdomain: string,
    isActive: boolean,
  ): Promise<Tanant | null> {
    return this.tanantModel.findOneAndUpdate(
      { subdomain },
      { is_active: isActive },
      { new: true },
    );
  }

  async getRolePermissions(role_ids: string[], db_name: string) {
    this.rolePermissionModel = await setTanantConnection(
      db_name,
      RolePermission.name,
      RolePermissionSchema,
    );
    const role_permissions = await this.rolePermissionModel
      .find({ role_id: { $in: role_ids } })
      .exec();
    return role_permissions;
  }

  async getUserRolePermissions(db_name, ids) {
    this.tanantPermissionModel = await setTanantConnection(
      db_name,
      'Permission',
      PermissionSchema,
    );
    const permissions = await this.tanantPermissionModel
      .find({ is_active: true, _id: ids })
      .exec();
    return permissions.map((permission) => {
      return {
        id: permission._id,
        name: permission.name,
        is_active: permission.is_active,
      };
    });
  }

  async getTanantRole(roleName, db_name) {
    this.roleModel = await setTanantConnection(db_name, 'Role', RoleSchema);
    return await this.roleModel.findOne({ name: roleName }).exec();
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

  async deleteStaff(id: string, db_name: string, i18n: I18nContext) {
    this.tanantUserModel = setTanantConnection(
      db_name,
      TanantUser.name,
      TanantUserSchema,
    );
    const DeletedStaff = await this.tanantUserModel.findOne({ _id: id });
    if (DeletedStaff.not_deletable === true) {
      throw new HttpException(
        { status: _401, message: i18n.t(`lang.auth.staff_not_delete`) },
        _401,
      );
    }
    if (!DeletedStaff.is_active) {
      throw new HttpException(
        { status: _300, message: i18n.t(`lang.auth.staff_already_exist`) },
        _300,
      );
    }
    DeletedStaff.deleted_at = date_moment();
    DeletedStaff.is_active = false;
    DeletedStaff.is_deleted = true;
    return await DeletedStaff.save();
  }

  async updateStaff(updateData: UpdateStaffDTO, db_name: string) {
    this.tanantUserModel = setTanantConnection(
      db_name,
      TanantUser.name,
      TanantUserSchema,
    );

    const staffId = new ObjectId(updateData.id);
    const existingStaff = await this.tanantUserModel.findById(staffId).exec();
    const updateFields = Object.entries(updateData)
      .filter(([key, value]) => value != null && key !== 'id')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const updatedStaff = await this.tanantUserModel
      .findByIdAndUpdate(
        staffId,
        {
          $set: {
            ...updateFields,
            updated_at: date_moment(),
          },
        },
        { new: true, runValidators: true },
      )
      .exec();

    const phoneUpdated =
      updateData.mobile_number &&
      updateData.mobile_number !== existingStaff.mobile_number;
    const emailUpdated =
      updateData.email && updateData.email !== existingStaff.email;

    if (phoneUpdated && emailUpdated) {
      await this.staffNotificationsService.sendPushNotification(
        updateData.id,
        'staff_side_update_email_phone',
        'notification',
        1,
        db_name,
        updateData.id,
      );
    } else if (phoneUpdated) {
      await this.staffNotificationsService.sendPushNotification(
        updateData.id,
        'staff_side_update_phone',
        'notification',
        1,
        db_name,
        updateData.id,
      );
    } else if (emailUpdated) {
      await this.staffNotificationsService.sendPushNotification(
        updateData.id,
        'staff_side_update_email',
        'notification',
        1,
        db_name,
        updateData.id,
      );
    }
    return updatedStaff;
  }

  async getStaff(
    id: string,
    store_id: string,
    search_key: string,
    db_name: string,
  ) {
    this.tanantUserModel = setTanantConnection(
      db_name,
      TanantUser.name,
      TanantUserSchema,
    );

    const query: any = { _id: { $nin: [new ObjectId(id)] } };

    if (store_id) {
      query.store_id = new ObjectId(store_id);
    } else {
      query.store_id = null;
    }

    if (search_key && search_key.trim() !== '') {
      query.$or = [
        { first_name: { $regex: new RegExp(search_key, 'i') } },
        { last_name: { $regex: new RegExp(search_key, 'i') } },
        { email: { $regex: new RegExp(search_key, 'i') } },
        { mobile_number: { $regex: new RegExp(search_key, 'i') } },
      ];
    }

    const Staff = await this.tanantUserModel
      .find(query)
      .select('-password')
      .exec();

    return Staff;
  }

  async updateStaffBranchId(
    db_name: string,
    staff_id: string,
    store_id: string,
  ): Promise<any> {
    this.tanantUserModel = await setTanantConnection(
      db_name,
      'User',
      TanantUserSchema,
    );

    const updatedStaff = await this.tanantUserModel.findOneAndUpdate(
      { _id: staff_id },
      {
        $set: {
          store_id: store_id,
        },
      },
      { new: true },
    );
    return updatedStaff;
  }

  async getTenantProfile(id: string, db_name): Promise<any> {
    this.tanantUserModel = await setTanantConnection(
      db_name,
      'User',
      TanantUserSchema,
    );
    this.userRoleModel = await setTanantConnection(
      db_name,
      'UserRole',
      UserRoleSchema,
    );
    this.roleModel = await setTanantConnection(db_name, 'Role', RoleSchema);

    let user;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await this.tanantUserModel.findOne({ _id: id }).exec();
    }

    const userRole = await this.userRoleModel
      .find({ user_id: user._id })
      .exec();
    const userRoleIds = userRole.map((userRole) => userRole.role_id);
    const roles = await this.roleModel
      .find({ _id: { $in: userRoleIds } })
      .exec();
    return {
      _id: user?._id,
      store_id: user?.store_id,
      franchise: user?.franchise,
      role: roles ? roles.map((role) => role.name) : [],
      first_name: user?.first_name,
      last_name: user?.last_name,
      email: user?.email,
      country_code: user?.country_code,
      mobile_number:`${user?.country_code}${ user?.mobile_number}`,
      agent_code: user?.agent_code,
      profile_image: user?.profile_image,
      id: user?.id,
    };
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    db_name: string,
    i18n: I18nContext,
  ): Promise<MasterUser | any> {
    this.tanantUserModel = await setTanantConnection(
      db_name,
      'User',
      TanantUserSchema,
    );

    const user = await this.tanantUserModel.findById({ _id: id }).exec();
    if (!user) {
      return false;
    }

    if (
      user.email != updateUserDto.email ||
      user.mobile_number != updateUserDto.mobile_number
    ) {
      if (user.email != updateUserDto.email) {
        const existingUser = await this.tanantUserModel
          .findOne({ email: updateUserDto.email })
          .exec();
        if (existingUser) {
          throw new BadRequestException(i18n.t(`lang.auth.email_exists`));
        }
      }
      if (user.mobile_number != updateUserDto.mobile_number) {
        const existingUser = await this.tanantUserModel
          .findOne({ mobile_number: updateUserDto.mobile_number })
          .exec();
        if (existingUser) {
          throw new BadRequestException(i18n.t(`lang.auth.phone_exists`));
        }
      }
    }

    const updatedUser = await this.tanantUserModel.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          first_name: updateUserDto?.first_name,
          last_name: updateUserDto?.last_name,
          email: updateUserDto?.email,
          country_code: updateUserDto?.country_code,
          mobile_number: updateUserDto?.mobile_number,
        },
      },
      { new: true },
    );

    return {
      _id: updatedUser.id,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      email: updatedUser.email,
      mobile_number: updatedUser.mobile_number,
    };
  }

  async getStaffList(
    id: string,
    store_id: string,
    admin: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.tanantUserModel = await setTanantConnection(
      db_name,
      'User',
      TanantUserSchema,
    );

    this.userRoleModel = await setTanantConnection(
      db_name,
      'UserRole',
      UserRoleSchema,
    );
    this.roleModel = await setTanantConnection(db_name, 'Role', RoleSchema);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(i18n.t(`lang.auth.invalid_id`));
    }

    const query: any = {
      _id: { $ne: new mongoose.Types.ObjectId(id) },
      is_deleted: false,
    };

    if (admin === 'false') {
      query.is_admin = false;
    }
    if (store_id) {
      query.store_id = new mongoose.Types.ObjectId(store_id);
    }
    const users = await this.tanantUserModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();

    const userWithBranchDetails = await Promise.all(
      users.map(async (user) => {
        const rolePermission = await this.userRoleModel
          .find({ user_id: user.id })
          .exec();
        const userRoleIds = rolePermission.map((userRole) => userRole.role_id);

        const role_name = await this.roleModel
          .find({ _id: { $in: userRoleIds } })
          .exec();
        const branchDetails = await this.storeService.getStoreDetails(
          user.store_id,
          db_name,
        );

        return {
          ...user.toObject(),
          mobile_number: `${user?.country_code}${user?.mobile_number}`,
          profile_image: user?.profile_image || '',
          branch_name: branchDetails?.name || '',
          role_id: userRoleIds || [],
          role_name: role_name.map((role) => role.name) || [],
        };
      }),
    );

    return userWithBranchDetails;
  }

  async signOut(id: string, db_name: string, i18n: I18nContext): Promise<any> {
    this.tanantUserModel = await setTanantConnection(
      db_name,
      'User',
      TanantUserSchema,
    );

    const user = await this.tanantUserModel.findOne({ _id: id }).exec();
    if (user) {
      user.token = null;
      await user.save();
      return {
        data: {},
      };
    }
    throw new NotFoundException(i18n.t(`lang.auth.not_found`));
  }
}

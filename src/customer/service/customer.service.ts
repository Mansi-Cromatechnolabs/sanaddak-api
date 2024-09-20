import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { bcryptComparePassword, bcryptPassword } from 'src/utils/helper';
import { Model } from 'mongoose';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { date_moment, format_date } from 'src/utils/date.util';
import { _400, _404 } from 'src/utils/http-code.util';
import {
  UpdateCustomerStatus,
  UpdateKYCStatus,
  UpdateUserDto,
} from '../dto/update-user.dto';
import { Customer, CustomerSchema } from '../schema/customer.schema';
import { ChangePasswordDto } from '../dto/change-password.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/forget-password.dto';
import { UserRegistertDTO } from '../dto/user-registration.dto';
import {
  UserVerification,
  VerifyOtp,
  CheckPasswordDto,
} from '../../app/auth/dto/verify.dto';
import { CustomerTagService } from './customer_tag.service';
import { TagService } from 'src/app/gold_loan/tag.service';
import { UserLoginDto } from '../dto/login.dto';
import { PushNotificationEnableDto } from '../dto/push_notification_enable.dto';
import { CustomerDto } from '../dto/Customer.dto';
import * as Twilio from 'twilio';
import { createVerification } from 'src/utils/twillo.util';
import { sendEmail } from 'src/utils/sendgrid.util';
import { checkVerification } from 'src/utils/twillo.util';
import { GlobalConfigService } from 'src/app/global_config/global_config.service';
import { GoldLoanService } from 'src/app/gold_loan/gold_loan.service';
import { I18nContext } from 'nestjs-i18n';
import { LoanService } from 'src/app/loan/service/loan.service';
import { EmailTemplateService } from 'src/app/email_template/email_template.service';
import {
  DeviceInfo,
  DeviceInfoSchema,
} from 'src/app/dashboard/schema/device-info.schema';
@Injectable()
export class CustomerService {
  public customerModel: Model<any>;
  private deviceModel: Model<DeviceInfo>;
  constructor(
    private readonly jwtService: JwtService,
    private readonly customerTagService: CustomerTagService,
    private readonly tagService: TagService,
    @Inject(forwardRef(() => GlobalConfigService))
    private readonly configService: GlobalConfigService,
    @Inject(forwardRef(() => GoldLoanService))
    private readonly goldLoanService: GoldLoanService,
    @Inject(forwardRef(() => LoanService))
    private readonly loanService: LoanService,
    @Inject(forwardRef(() => EmailTemplateService))
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

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

  async getUserProfile(id: string, db_name: string): Promise<Customer> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );
    let user;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await this.customerModel.findById({ _id: id }).exec();
    }
    return user ? user : false;
  }

  async getUserProfileByEmail(
    email: string,
    db_name: string,
  ): Promise<Customer | null> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );

    const user = await this.customerModel
      .findOne({ email, is_deleted: false })
      .exec();
    return user;
  }

  async findUser(phone: string, db_name: string): Promise<any> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );

    const formattedPhoneNumber = phone.replace(' ', '');
    const user = await this.customerModel
      .findOne({
        $or: [
          {
            phone,
            is_deleted: false,
          },
          {
            $expr: {
              $eq: [{ $concat: ['$country_code', '$phone'] }, `+${phone}`],
            },
            is_deleted: false,
          },
          {
            $expr: {
              $eq: [{ $concat: ['$country_code', '$phone'] }, `${phone}`],
            },
            is_deleted: false,
          },
          {
            $expr: {
              $eq: [
                { $concat: ['$country_code', '$phone'] },
                `+${formattedPhoneNumber}`,
              ],
            },
            is_deleted: false,
          },
          {
            $expr: {
              $eq: [
                { $concat: ['$country_code', '$phone'] },
                `${formattedPhoneNumber}`,
              ],
            },
            is_deleted: false,
          },
        ],
      })
      .exec();
    return user;
  }

  async userRegistration(
    userRegisterDTO: UserRegistertDTO,
    db_name: string,
    tenant: any,
    i18n: I18nContext,
  ): Promise<any> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );

    const queryConditions: any[] = [
      { phone: userRegisterDTO.phone, is_deleted: false },
    ];

    if (userRegisterDTO.email && userRegisterDTO.email !== '') {
      queryConditions.push({
        email: userRegisterDTO.email.toLowerCase(),
        is_deleted: false,
      });
    }

    const existingUser = await this.customerModel.findOne({
      $or: queryConditions,
    });

    if (existingUser) {
      if (existingUser.is_active === false) {
        throw new BadRequestException(i18n.t(`lang.auth.inactive_account`));
      } else {
        throw new BadRequestException(i18n.t(`lang.auth.user_exists`));
      }
    }

    const hashedPassword = await bcryptPassword(userRegisterDTO.password);

    const newUser = new this.customerModel({
      ...userRegisterDTO,
      email: userRegisterDTO.email.toLowerCase(),
      password: hashedPassword,
      is_active: true,
    });

    const savedUser = await newUser.save();

    const token = await this.generateToken(
      { ...savedUser._doc, id: savedUser._doc._id },
      [],
      tenant,
    );
    savedUser.token = token;
    await savedUser.save();

    const configGlobalDate = await this.configService.getGlobalConfig(
      {
        key: 'global_date_time_format',
      },
      db_name,
      i18n,
    );

    const tag = await this.tagService.getTagByName('Egypt', db_name);
    await this.customerTagService.customerTag(
      {
        customer_id: savedUser.id,
        priority: 1,
        tag_id: tag['_id'],
        customer_tag_id: '',
        create_date: date_moment(),
        update_date: date_moment(),
      },
      db_name,
    );

    if (savedUser?.email?.trim()) {
      await this.emailTemplateService.sendEmail(
        savedUser.email,
        'signup_user',
        db_name,
        { customer_name: `${savedUser?.first_name} ${savedUser?.last_name}` },
      );
    }

    return {
      id: savedUser._id,
      first_name: savedUser?.first_name,
      last_name: savedUser?.last_name,
      email: savedUser?.email,
      country_code: savedUser?.country_code,
      phone: savedUser.phone,
      voucher_code: savedUser?.voucher_code || '',
      agent_code: savedUser?.agent_code,
      is_active: savedUser.is_active,
      global_date_format: configGlobalDate || '',
      token: token,
    };
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
    } else if (is_active) {
      throw new BadRequestException(i18n.t(`lang.auth.not_found`));
    }

    if (type === 'phone') {
      const phoneNumber = user ? `${user.country_code}${user.phone}` : value;
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
      //TODO:= SEND OTP EMAIL USING EMAIL TEMPLATE
      // if(user?.email || value){
      //   const data = {
      //     customer_name: `${user?.first_name} ${user?.last_name}`,
      //     otp_code: "123456"
      //   }
      //   console.log(data);
      //   await this.emailTemplateService.sendEmail(user?.email ?? value, "otp_verification", db_name, data);
      // }

      //TODO:= SEND OTP EMAIL USING TWILLO
      // const otpResponse = await createVerification('email',value);
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

    if (type == 'phone') {
      const otp = await this.sendOtp(
        { type, value, is_active: true },
        db_name,
        i18n,
      );
      return {
        user_id: user.id,
        type,
        value: `${user.country_code}${user.phone}`,
      };
    } else if (type == 'email') {
      const otp = await this.sendOtp(
        { type, value, is_active: true },
        db_name,
        i18n,
      );
      return {
        user_id: user.id,
        type,
        value: user.email,
      };
    }
  }

  async verifyOtp(
    verifyOtp: VerifyOtp,
    db_name,
    i18n: I18nContext,
  ): Promise<any> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );
    const { type, value, otp } = verifyOtp;
    const customer =
      type === 'phone'
        ? await this.findUser(value, db_name)
        : await this.getUserProfileByEmail(value.toLowerCase(), db_name);

    if (customer) {
      if (type === 'email') {
        customer.is_email_verified = true;
      } else if (type === 'phone') {
        customer.is_mobile_number_verified = true;
      }
      await customer.save();

      if (customer.is_active === false) {
        throw new BadRequestException(i18n.t(`lang.auth.inactive_account`));
      }
    }

    // let otpStatus;
    if (type === 'email') {
      // otpStatus = await checkVerification(otp, value);
      // if (otpStatus) {
      //   if (otpStatus?.status === 'failed') {
      //     throw new NotFoundException({
      //       message: 'Invalid OTP.',
      //       status: _400,
      //     });
      //   }
      return {
        data: { type },
      };
      // }
    } else if (type === 'phone') {
      // otpStatus = await checkVerification(otp, value);
      // if (otpStatus) {
      //   if (otpStatus?.status === 'failed') {
      //     throw new NotFoundException({
      //       message: 'Invalid OTP.',
      //       status: _400,
      //     });
      //   }
      return {
        data: { type },
      };
      // }
    }
  }

  async userLogin(
    loginDto: UserLoginDto,
    db_name: string,
    tenant,
    i18n: I18nContext,
  ): Promise<any> {
    const { type, value, password } = loginDto;
    let user;

    user =
      type === 'email'
        ? await this.getUserProfileByEmail(value.toLowerCase(), db_name)
        : await this.findUser(value, db_name);
    if (!user) {
      throw new NotFoundException(i18n.t(`lang.auth.login_credential_faild`));
    }

    if (user.is_active === false) {
      throw new BadRequestException(i18n.t(`lang.auth.inactive_account`));
    }

    if (!(await bcryptComparePassword(password, user.password))) {
      throw new BadRequestException(i18n.t(`lang.auth.invalid_password`));
    }

    const configGlobalDate = await this.configService.getGlobalConfig(
      {
        key: 'global_date_time_format',
      },
      db_name,
      i18n,
    );
    const otp = await this.sendOtp(
      { type, value, is_active: true },
      db_name,
      i18n,
    );

    await this.customerModel.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          fcm_token: loginDto.fcm_token,
        },
      },
      { new: true },
    );

    const token = await this.generateToken(
      {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        country_code: user.country_code,
        phone: user.phone,
        is_active: user.is_active,
        type,
      },
      [],
      tenant,
    );
    user.token = token;
    await user.save();
    if (user.email?.trim()) {
      this.deviceModel = setTanantConnection(
        db_name,
        DeviceInfo.name,
        DeviceInfoSchema,
      );

      const device_data = await this.deviceModel
        .findOne({ user_id: user?._id })
        .sort({ last_login_datetime: -1 })
        .exec();

      if (device_data) {
        const formattedDate = format_date(
          'DD MMMM YYYY, hh:mm:ss A',
          device_data?.last_login_datetime,
        );

        const data: any = {
          customer_name: `${user?.first_name} ${user?.last_name}`,
          device_name: device_data?.device_name,
          date_and_time: formattedDate,
        };

        if (device_data?.location?.city && device_data?.location?.country) {
          data.city = device_data.location.city;
          data.country = device_data.location.country;
          data.location = `<strong>Location:</strong> ${device_data.location.city}, ${device_data.location.country}<br>`
        } else {
          data.location = ''; 
        }

        await this.emailTemplateService.sendEmail(
          user?.email,
          'sign_in_alert',
          db_name,
          data,
        );
      }
    }

    return {
      id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      country_code: user.country_code,
      profile_image: user?.profile_image || '',
      phone: user.phone,
      is_active: user.is_active,
      global_date_format: configGlobalDate || '',
      token,
      type,
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    db_name: string,
    i18n: I18nContext,
  ): Promise<boolean | any> {
    const { user_id, new_password } = resetPasswordDto;
    const user = await this.getUserProfile(user_id, db_name);

    if (!user) {
      throw new NotFoundException(i18n.t(`lang.auth.no_user`));
    }

    if (user.is_active === false) {
      throw new BadRequestException(i18n.t(`lang.auth.inactive_account`));
    }

    user.password = await bcryptPassword(new_password);
    await user.save();
    return {
      message: i18n.t(`lang.auth.change_password_success`),
      data: {},
    };
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    const { type, password, otp } = changePasswordDto;
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );

    const user = await this.customerModel.findOne({ _id: id }).exec();
    const value = `${user.country_code}${user.phone}`;
    const verify_otp = await this.verifyOtp(
      { type, value, otp },
      db_name,
      i18n,
    );
    if (verify_otp) {
      const newHashedPassword = await bcryptPassword(password);
      user.password = newHashedPassword;
      await user.save();
      return {
        message: 'OTP verified successfully.',
        data: {},
      };
    }
  }

  async signOut(id: string, db_name: string, i18n: I18nContext): Promise<any> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );

    const user = await this.customerModel.findOne({ _id: id }).exec();
    if (user) {
      user.token = null;
      await user.save();
      return {
        data: {},
      };
    }
    throw new NotFoundException(i18n.t(`lang.auth.not_found`));
  }

  async unRegister(id: string, db_name, i18n: I18nContext): Promise<any> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );
    const user = await this.customerModel.findOne({ _id: id }).exec();
    const customer_has_active_liquidity =
      await this.loanService.findCustomerActiveLoan(user.id, db_name);
    if (customer_has_active_liquidity) {
      throw new BadRequestException(i18n.t(`lang.auth.tanant.not_deletable`));
    }
    if (user) {
      user.is_active = false;
      user.is_deleted = true;
      await user.save();
      return {
        data: {},
      };
    }
    throw new NotFoundException(i18n.t(`lang.auth.not_found`));
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    db_name: string,
  ): Promise<Customer | any> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );

    const user = await this.customerModel.findById({ _id: id }).exec();
    if (!user) {
      return false;
    }
    const updatedUser = await this.customerModel.findOneAndUpdate(
      { _id: user.id },
      {
        $set: {
          first_name: updateUserDto?.first_name,
          last_name: updateUserDto?.last_name,
          email: updateUserDto?.email,
          country_code: updateUserDto?.country_code,
          phone: updateUserDto?.phone,
          profile_image: updateUserDto?.profile_image,
        },
      },
      { new: true },
    );
    return {
      _id: updatedUser.id,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      email: updatedUser.email,
      country_code: updatedUser.country_code,
      phone: updatedUser.phone,
      profile_image: updatedUser.profile_image,
    };
  }

  async checkPassword(
    id: string,
    checkPasswordDto: CheckPasswordDto,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );

    const user = await this.customerModel.findOne({ _id: id }).exec();

    const bcryptPassCompare = await bcryptComparePassword(
      checkPasswordDto.old_password,
      user.password,
    );

    let otp;
    if (bcryptPassCompare) {
      if (checkPasswordDto.type == 'email') {
        otp = await this.sendOtp(
          {
            type: checkPasswordDto.type,
            value: user.email,
            is_active: true,
          },
          db_name,
          i18n,
        );

        return {
          message: i18n.t(`lang.auth.verify_email_otp`),
          data: {
            type: checkPasswordDto.type,
            value: user.email,
          },
        };
      } else {
        const phone_number = `${user.country_code} ${user.phone}`;
        otp = await this.sendOtp(
          {
            type: checkPasswordDto.type,
            value: phone_number,
            is_active: true,
          },
          db_name,
          i18n,
        );
        return {
          message: i18n.t(`lang.auth.verify_mobile_otp`),
          data: {
            type: checkPasswordDto.type,
            value: phone_number,
          },
        };
      }
    }
    throw new BadRequestException(i18n.t(`lang.auth.invalid_old_password`));
  }

  async pushNotificationEnable(
    id: string,
    pushNotificationEnableDto: PushNotificationEnableDto,
    db_name: string,
  ): Promise<Customer | any> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );

    const user = await this.customerModel.findById({ _id: id }).exec();
    if (!user) {
      return false;
    }
    const updatedUser = await this.customerModel.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          is_notification_enable:
            pushNotificationEnableDto.is_notification_enable,
        },
      },
      { new: true },
    );

    return updatedUser;
  }

  async getCustomerList(
    db_name: string,
    body: CustomerDto,
    i18n: I18nContext,
    type?: number,
    store_id?: string,
  ): Promise<any> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );

    const query: any = { is_deleted: false };

    if (body.search_key && body.search_key.trim() !== '') {
      const search_key = body.search_key.trim();
      query.$or = [
        { first_name: { $regex: new RegExp(search_key, 'i') } },
        { last_name: { $regex: new RegExp(search_key, 'i') } },
        { email: { $regex: new RegExp(search_key, 'i') } },
        { mobile_number: { $regex: new RegExp(search_key, 'i') } },
      ];
    }

    let aggregationPipeline: any[] = [{ $match: query }];

    if (type == 1) {
      aggregationPipeline.push(
        {
          $lookup: {
            from: 'initialvaluations',
            localField: '_id',
            foreignField: 'customer_id',
            as: 'valuations',
          },
        },
        {
          $unwind: {
            path: '$valuations',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $and: [
              { 'valuations.valuation_status': 4 },
              { 'valuations.valuation_status': { $ne: null } },
            ],
          },
        },
        {
          $lookup: {
            from: 'userkycdetails',
            localField: '_id',
            foreignField: 'customer_id',
            as: 'kyc_details',
          },
        },
        {
          $unwind: {
            path: '$kyc_details',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            email: 1,
            country_code: 1,
            phone: 1,
            is_active: 1,
            is_email_verified: 1,
            is_mobile_number_verified: 1,
            is_kyc_verified: { $ifNull: ['$is_kyc_verified', ''] },
            valuation_id: '$valuations._id',
            valuation_status: '$valuations.valuation_status',
            gold_weight: '$valuations.gold_weight',
            gold_purity_entered_per_1000:
              '$valuations.gold_purity_entered_per_1000',
            tenure_in_months: '$valuations.tenure_in_months',
            customer_cash_needs: '$valuations.customer_cash_needs',
            cash_to_customer: '$valuations.cash_to_customer',
            valuation_number: '$valuations.valuation_number',
            profile_image: {
              $ifNull: ['$profile_image', ''],
            },
            kyc_status: {
              $ifNull: ['$kyc_details.kyc_status', ''],
            },
          },
        },
      );
    } else if (type == 2) {
      aggregationPipeline.push(
        {
          $lookup: {
            from: 'loans',
            localField: '_id',
            foreignField: 'customer_id',
            as: 'loans',
          },
        },
        {
          $match: {
            'loans.is_verified': true,
          },
        },
        {
          $unwind: '$loans',
        },
        {
          $match: {
            'loans.is_verified': true,
            // ...(store_id ? { 'loans.branch_id': new mongoose.Types.ObjectId(store_id) } : {}),
          },
        },
        {
          $lookup: {
            from: 'userkycdetails',
            localField: '_id',
            foreignField: 'customer_id',
            as: 'kyc_details',
          },
        },
        {
          $unwind: {
            path: '$kyc_details',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: {
              customer_id: '$_id',
              first_name: '$first_name',
              last_name: '$last_name',
              email: '$email',
              country_code: '$country_code',
              phone: '$phone',
              is_active: '$is_active',
              is_kyc_verified: { $ifNull: ['$is_kyc_verified', ''] },
              is_email_verified: '$is_email_verified',
              is_mobile_number_verified: '$is_mobile_number_verified',
              profile_image: { $ifNull: ['$profile_image', ''] },
            },
            liquidity_status: { $addToSet: '$loans.loan_status' },
            kyc_status: {
              $first: { $ifNull: ['$kyc_details.kyc_status', ''] },
            },
          },
        },
        {
          $project: {
            _id: '$_id.customer_id',
            first_name: '$_id.first_name',
            last_name: '$_id.last_name',
            email: '$_id.email',
            country_code: '$_id.country_code',
            phone: '$_id.phone',
            is_active: '$_id.is_active',
            is_kyc_verified: '$_id.is_kyc_verified',
            is_email_verified: '$_id.is_email_verified',
            is_mobile_number_verified: '$_id.is_mobile_number_verified',
            profile_image: '$_id.profile_image',
            liquidity_status: 1,
            kyc_status: 1,
          },
        },
      );
    } else if (type == 3) {
      aggregationPipeline.push(
        {
          $lookup: {
            from: 'userkycdetails',
            localField: '_id',
            foreignField: 'customer_id',
            as: 'kyc_details',
          },
        },
        {
          $unwind: {
            path: '$kyc_details',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'Staff',
            localField: 'kyc_details.review_by',
            foreignField: '_id',
            as: 'reviewer',
          },
        },
        {
          $unwind: {
            path: '$reviewer',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: [
              { 'kyc_details.review_status': { $exists: false } },
              { 'kyc_details.review_status': { $eq: null } },
              { 'kyc_details.review_status': '' },
              { 'kyc_details.review_status': { $ne: 'Approved' } }
            ],
          },
        },
        {
          $project: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            email: 1,
            country_code: 1,
            phone: 1,
            is_active: 1,
            is_kyc_verified: 1,
            is_email_verified: 1,
            is_mobile_number_verified: 1,
            kyc_status: {
              $ifNull: ['$kyc_details.kyc_status', ''],
            },
            review_by: {
              $ifNull: [
                {
                  $concat: [
                    { $ifNull: ['$reviewer.first_name', ''] },
                    ' ',
                    { $ifNull: ['$reviewer.last_name', ''] },
                  ],
                },
                '',
              ],
            },
            review_status: {
              $ifNull: ['$kyc_details.review_status', ''],
            },
          },
        },
      );
    } else {
      aggregationPipeline.push(
        {
          $lookup: {
            from: 'userkycdetails',
            localField: '_id',
            foreignField: 'customer_id',
            as: 'kyc_details',
          },
        },
        {
          $unwind: {
            path: '$kyc_details',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'Staff',
            localField: 'kyc_details.review_by',
            foreignField: '_id',
            as: 'reviewer',
          },
        },
        {
          $unwind: {
            path: '$reviewer',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            email: 1,
            country_code: 1,
            profile_image: 1,
            phone: 1,
            is_active: 1,
            is_kyc_verified: 1,
            is_email_verified: 1,
            is_mobile_number_verified: 1,
            kyc_status: {
              $ifNull: ['$kyc_details.kyc_status', ''],
            },
            review_by: {
              $ifNull: [
                {
                  $concat: [
                    { $ifNull: ['$reviewer.first_name', ''] },
                    ' ',
                    { $ifNull: ['$reviewer.last_name', ''] },
                  ],
                },
                '',
              ],
            },
            review_status: {
              $ifNull: ['$kyc_details.review_status', ''],
            },
          },
        },
      );
    }

    const customers = await this.customerModel
      .aggregate(aggregationPipeline)
      .exec();

    const customersWithLoanAndProfile = await Promise.all(
      customers.map(async (customer) => {
        return {
          ...customer,
          email: customer.email || '',
          profile_image: customer?.profile_image || '',
          cash_to_customer: customer?.cash_to_customer
            ? await this.goldLoanService.formatCurrency(
                customer?.cash_to_customer,
                i18n,
              )
            : '',
          customer_cash_needs: customer?.customer_cash_needs
            ? await this.goldLoanService.formatCurrency(
                customer?.customer_cash_needs,
                i18n,
              )
            : '',
        };
      }),
    );

    return customersWithLoanAndProfile.length === 0
      ? []
      : customersWithLoanAndProfile;
  }

  async updateCustomerStatus(
    db_name,
    updateCustomerStatus: UpdateCustomerStatus,
    i18n: I18nContext,
  ): Promise<any> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );
    const customer_has_active_liquidity =
      await this.loanService.findCustomerActiveLoan(
        updateCustomerStatus?.customer_id,
        db_name,
      );
    if (
      customer_has_active_liquidity &&
      updateCustomerStatus?.is_active === false
    ) {
      throw new BadRequestException(i18n.t(`lang.auth.tanant.not_deactivated`));
    } else if (
      customer_has_active_liquidity &&
      updateCustomerStatus?.is_deleted === true
    ) {
      throw new BadRequestException(i18n.t(`lang.auth.tanant.not_deletable`));
    }

    const updatedCustomer = await this.customerModel.findOneAndUpdate(
      { _id: updateCustomerStatus.customer_id },
      {
        $set: {
          is_active: updateCustomerStatus?.is_active,
          is_deleted: updateCustomerStatus?.is_deleted,
        },
      },
      { new: true },
    );
    if (updatedCustomer) {
      return updateCustomerStatus;
    }

    throw new NotFoundException(i18n.t(`lang.auth.not_found`));
  }
  async updateKycStatus(
    db_name,
    updateKYCStatus: UpdateKYCStatus,
    i18n: I18nContext,
  ): Promise<any> {
    this.customerModel = setTanantConnection(
      db_name,
      Customer.name,
      CustomerSchema,
    );

    const updatedCustomer = await this.customerModel.findOneAndUpdate(
      { _id: updateKYCStatus.customer_id },
      {
        $set: {
          is_kyc_verified: updateKYCStatus?.is_kyc_verified,
        },
      },
      { new: true },
    );
    if (updatedCustomer) {
      return updatedCustomer;
    }

    throw new NotFoundException(i18n.t(`lang.auth.not_found`));
  }
}

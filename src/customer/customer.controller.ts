import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  NotFoundException,
  Headers,
  Delete,
  UploadedFile,
  UseInterceptors,
  Patch,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { UserLoginDto } from './dto/login.dto';
import { Public } from 'src/decorators/public.decorator';
import { _200, _401, _404 } from 'src/utils/http-code.util';
import {
  PromiseResponse,
  errorResponse,
  successResponse,
} from 'src/utils/response.util';
import { Permission } from 'src/decorators/permission.decorator';
import { profileImageUpload } from 'src/utils/file.util';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateCustomerStatus, UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto, ResetPasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forget-password.dto';
import { UserRegistertDTO } from './dto/user-registration.dto';
import {
  UserVerification,
  VerifyOtp,
  CheckPasswordDto,
} from './dto/verify.dto';
import { CustomerService } from './service/customer.service';
import { AuthService } from 'src/app/auth/auth.service';
import { CustomerTagService } from './service/customer_tag.service';
import {
  CreateCustomertagDTO,
  CustomerTagDTO,
  DeleteCustomerTagDTO,
} from './dto/customer_tag.dto';
import { PushNotificationEnableDto } from './dto/push_notification_enable.dto';
import { CustomerDto } from './dto/Customer.dto';
import { CustomerInsightService } from './service/customer_insight.service';
import { CustomerInsightDTO } from './dto/customer_insight.dto';

@ApiTags('Customer')
@Controller('customer')
@ApiBearerAuth()
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly authService: AuthService,
    private readonly customerTagService: CustomerTagService,
    private readonly customerInsightService: CustomerInsightService,
  ) {}

  @Post('customer_tag')
  @ApiResponse({ status: _200, description: 'Tag added successfully.' })
  async addTagConfig(
    @Request() req,
    @Body() customertagDTO: CreateCustomertagDTO[],
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const tag = await this.customerTagService.addCustomerTag(
        customertagDTO,
        req.user.db_name,           
        i18n
      );
      return successResponse(_200, i18n.t(`lang.gold_loan.tag_update`), tag);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('customer_tags')
  @ApiResponse({ status: _200, description: 'Tag retrieved successfully.' })
  async getCustomerTags(
    @Request() req,
    @Body() customertagDTO: CustomerTagDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const tag = await this.customerTagService.
      getCustomerTags(
        customertagDTO,
        req.user.db_name,
      );

      return successResponse(
        _200,
        i18n.t(`lang.gold_loan.tag_retrieve_success`),
        tag,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Delete('customer_tag')
  @ApiResponse({ status: _200, description: 'Tag deleted successfully.' })
  async deleteTag(
    @Request() req,
    @Body() deleteCustomerTagDTO: DeleteCustomerTagDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const tag = await this.customerTagService.deleteCustomerTag(
        deleteCustomerTagDTO,
        req.user.db_name,
        i18n,
      );
      return successResponse(_200, i18n.t(`lang.gold_loan.tag_deleted`), tag);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Public()
  @Post('sign_up')
  @ApiResponse({ status: _200, description: 'New user Registered.' })
  async userRegistration(
    @Headers('x-tenant-id') tenantId: string,
    @Body() userRegistertDTO: UserRegistertDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    const tanant = await this.authService.getTanantBySubdomain(tenantId, true);
    try {
      const user = await this.customerService.userRegistration(
        userRegistertDTO,
        tanant.db_name,
        tanant,
        i18n
      );
      return successResponse(_200, i18n.t(`lang.auth.new_user_register`), user);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Public()
  @Post('send_otp')
  @ApiResponse({ status: _200, description: 'Otp generated successfully.' })
  async SendOtp(
    @Headers('x-tenant-id') tenantId: string,
    @Body() userVerification: UserVerification,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    const { db_name } = await this.authService.getTanantBySubdomain(
      tenantId,
      true,
    );
    try {
      const user = await this.customerService.sendOtp(
        userVerification,
        db_name,
        i18n
      );
      if (user) {
        return successResponse(_200, i18n.t(`lang.auth.generated_otp`), user);
      }
      throw new NotFoundException(i18n.t(`lang.auth.invalid_otp`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @Public()
  @Post('verify_otp')
  @ApiResponse({ status: _200, description: 'OTP verified successfully.' })
  async verifyOtp(
    @Headers('x-tenant-id') tenantId: string,
    @Body() verifyOtp: VerifyOtp,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );

      const user = await this.customerService.verifyOtp(verifyOtp, db_name, i18n);
      
      if (user) {
        return successResponse(
          _200,
          i18n.t(`lang.auth.otp_verified`),
          user.data,
        );
      }
      throw new BadRequestException(i18n.t(`lang.auth.verification_failed`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @Public()
  @Post('sign_in')
  @ApiResponse({ status: _200, description: 'User login successfully.' })
  async userLogin(
    @Headers('x-tenant-id') tenantId: string,
    @Body() loginDto: UserLoginDto,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const tenant = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );
      const user = await this.customerService.userLogin(
        loginDto,
        tenant.db_name,
        tenant,
        i18n
      );
      if (user) {
        if (loginDto.type == 'email') {
          return successResponse(
            _200,
            i18n.t(`lang.auth.email_not_verified`),
            user,
          );
        } else {
          return successResponse(
            _200,
            i18n.t(`lang.auth.phone_not_verified`),
            user,
          );
        }
      }
      throw new NotFoundException(i18n.t(`lang.auth.login_credential_faild`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @Public()
  @Post('forgot_password')
  @ApiResponse({ status: _200, description: 'Forgot password successfully.' })
  async ForgotPassword(
    @Headers('x-tenant-id') tenantId: string,
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );
      const user = await this.customerService.forgotPassword(
        forgotPasswordDto,
        db_name,
        i18n
      );
      if (user) {
        return successResponse(_200, i18n.t(`lang.auth.user_found`), user);
      }
      throw new BadRequestException(i18n.t(`lang.auth.invalid_otp`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @Public()
  @Post('reset_password')
  @ApiResponse({ status: _200, description: 'Password reset successfully.' })
  async resetPassword(
    @Headers('x-tenant-id') tenantId: string,
    @Body() ResetPasswordDto: ResetPasswordDto,
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );
      const user = await this.customerService.resetPassword(
        ResetPasswordDto,
        db_name,
        i18n
      );
      if (user) {
        return successResponse(
          _200,
          i18n.t(`lang.auth.change_password_success`),
          user.data,
        );
      }
      throw new BadRequestException(i18n.t(`lang.auth.reset_password_fail`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('change_password')
  @ApiResponse({ status: _200, description: 'Password updated successfully.' })
  @ApiResponse({ status: _401, description: 'Unauthorized.' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.customerService.changePassword(
        req.user.id,
        changePasswordDto,
        req.user.db_name,
        i18n
      );
      if (user) {
        return successResponse(
          _200,
          i18n.t(`lang.auth.change_password_success`),
          user.data,
        );
      }
      throw new BadRequestException(i18n.t(`lang.auth.verification_failed`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('sign_out')
  @ApiResponse({ status: _200, description: 'User signout successfully.' })
  @ApiResponse({ status: _401, description: 'Unauthorized.' })
  async signout(
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.customerService.signOut(
        req.user.id,
        req.user.db_name,
        i18n
      );
      if (user) {
        return successResponse(
          _200,
          i18n.t(`lang.auth.signout_success`),
          user.data,
        );
      }
      throw new NotFoundException(i18n.t(`lang.auth.signout_found`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('delete_account')
  @ApiResponse({ status: _200, description: 'User signout successfully.' })
  @ApiResponse({ status: _401, description: 'Unauthorized.' })
  async unRegister(
    @Headers('x-tenant-id') tenantId: string,
    @Request() req,
    @I18n() i18n: I18nContext,
    @Query('customer_id') customer_id?: string,
  ): Promise<PromiseResponse> {
    let customerId: string;
    if (customer_id) {
      customerId = customer_id;
    } else {
      customerId = req.user.id;
    }
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );
      const user = await this.customerService.unRegister(customerId, db_name,i18n);
      if (user) {
        return successResponse(
          _200,
          i18n.t(`lang.auth.un_register`),
          user.data,
        );
      }
      throw new BadRequestException(i18n.t(`lang.auth.unregister_failed`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('check_password')
  @ApiResponse({ status: _200, description: 'Password checked successfully.' })
  @ApiResponse({ status: _401, description: 'Unauthorized.' })
  async checkPassword(
    @Headers('x-tenant-id') tenantId: string,
    @Body() checkPasswordDto: CheckPasswordDto,
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );
      const user = await this.customerService.checkPassword(
        req.user.id,
        checkPasswordDto,
        db_name,
        i18n
      );
      if (user.message == i18n.t(`lang.auth.verify_email_otp`)) {
        return successResponse(
          _200,
          i18n.t(`lang.auth.verify_email_otp`),
          user.data,
        );
      } else if (user.message == i18n.t(`lang.auth.verify_mobile_otp`)) {
        return successResponse(
          _200,
          i18n.t(`lang.auth.verify_mobile_otp`),
          user.data,
        );
      }
      throw new NotFoundException(i18n.t(`lang.auth.change_password_fail`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('profile')
  @ApiResponse({
    status: _200,
    description: 'User profile retrived successfully.',
  })
  async getUserProfile(
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.customerService.getUserProfile(
        req.user.id,
        req.user.db_name,
      );
      if (user) {
        return successResponse(_200, i18n.t(`lang.auth.user_found`), user);
      } else {
        throw new NotFoundException(i18n.t(`lang.auth.not_found`));
      }
    } catch (error) {
      errorResponse(error);
    }
  }

  @Patch('update_profile')
  @ApiResponse({
    status: _200,
    description: 'User profile updated successfully.',
  })
  async updateUser(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const user = await this.customerService.updateUser(
        req.user.id,
        updateUserDto,
        req.user.db_name,
      );
      if (user) {
        return successResponse(_200, i18n.t(`lang.auth.profile_updated`), user);
      } else {
        throw new NotFoundException(i18n.t(`lang.auth.profile_updated_fail`));
      }
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('push_notification_enable')
  @ApiResponse({
    status: _200,
    description: 'Notification enable/disable updated successfully.',
  })
  @ApiResponse({ status: _401, description: 'Unauthorized.' })
  async pushNotificationEnable(
    @Body() pushNotificationEnableDto: PushNotificationEnableDto,
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.customerService.pushNotificationEnable(
        req.user.id,
        pushNotificationEnableDto,
        req.user.db_name,
      );

      if (user) {
        const message = pushNotificationEnableDto.is_notification_enable
          ? i18n.t('lang.notification.push_notification_enable_success')
          : i18n.t('lang.notification.push_notification_disable_success');

        return successResponse(_200, message, {});
      }

      throw new BadRequestException(
        i18n.t('lang.notification.push_notification_update_fail'),
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('customer_list')
  @ApiResponse({
    status: _200,
    description: 'Customers retrieved successfully.',
  })
  @ApiResponse({ status: _401, description: 'Unauthorized.' })
  async getCustomerList(
    @Request() req,
    @Body() body: CustomerDto,
    @I18n() i18n: I18nContext,
    @Query('type') type?: number,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.customerService.getCustomerList(
        req.user.db_name,
        body,
        i18n,
        type,
        req.user.store_id,
      );
      if (user) {
        return successResponse(_200, i18n.t(`lang.auth.user_fetch`), user);
      }
      throw new NotFoundException(i18n.t(`lang.auth.not_found`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @Patch('customer_status')
  @ApiResponse({
    status: _200,
    description: 'Customers retrieved successfully.',
  })
  @ApiResponse({ status: _401, description: 'Unauthorized.' })
  async updateCustomerStatus(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Body() updateCustomerStatus: UpdateCustomerStatus,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.customerService.updateCustomerStatus(
        req.user.db_name,
        updateCustomerStatus,
        i18n
      );
      if (user) {
        return successResponse(_200, i18n.t(`lang.auth.profile_updated`), user);
      }
      throw new NotFoundException(i18n.t(`lang.auth.not_found`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('personal_insight')
  @ApiResponse({
    status: _200,
    description: 'User personal insight retrived successfully.',
  })
  async getPersonalInsight(
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.customerInsightService.getPersonalInsight(
        req.user.id,
        req.user.db_name,
      );
      if (user) {
        return successResponse(_200, i18n.t(`lang.personal_insight.get`), user);
      } else {
        throw new NotFoundException(i18n.t(`lang.personal_insight.not_found`));
      }
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('personal_insight')
  @ApiResponse({
    status: _200,
    description: 'Added personal insight successfully.',
  })
  @ApiResponse({ status: _401, description: 'Unauthorized.' })
  async addUpdatePersonalInsight(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Body() customerInsightDTO: CustomerInsightDTO,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.customerInsightService.addUpdatePersonalInsight(
        req.user.id,
        customerInsightDTO,
        req.user.db_name,
      );
      if (user) {
        return successResponse(_200, i18n.t(`lang.personal_insight.add`), user);
      }
      throw new NotFoundException(i18n.t(`lang.personal_insight.not_found`));
    } catch (error) {
      errorResponse(error);
    }
  }
}

import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  NotFoundException,
  Query,
  Headers,
  Delete,
  Patch,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { MasterUserRegistertDTO } from './dto/registration.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { LoginDto, UserLoginDto } from './dto/login.dto';
import { Public } from 'src/decorators/public.decorator';
import { NoAuthRequire } from 'src/decorators/no-auth.decorator';
import { _200, _401, _404 } from 'src/utils/http-code.util';
import {
  PromiseResponse,
  errorResponse,
  successResponse,
} from 'src/utils/response.util';
import { AuthService } from './auth.service';
import { Permission } from 'src/decorators/permission.decorator';
import { StaffDeleteDto, StaffGetDto, UpdateStaffDTO } from './dto/staff.dto';
import { UserVerification, VerifyOtp } from './dto/verify.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forget-password.dto';
import { StaffChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Staff & Tenant')
@Controller()
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('tanant/create')
  @ApiResponse({
    status: _200,
    description: 'Master user registration successfully.',
  })
  async masterUserRegistration(
    @Body() masterUserRegistertDTO: MasterUserRegistertDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      // await this.authService.deleteExistingDbs();
      // return successResponse(_200,i18n.t(`lang.auth.tanant.register`));
      const tanant = await this.authService.existTanant(
        masterUserRegistertDTO.first_name,
      );
      if (tanant) {
        return successResponse(_200, i18n.t(`lang.auth.tanant.exist`));
      }
      const user = await this.authService.masterUserRegistration(
        masterUserRegistertDTO,
        i18n
      );
      return successResponse(_200, i18n.t(`lang.auth.tanant.register`), user);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('staff')
  @Permission('user.create')
  @ApiResponse({ status: _200, description: 'User registration successfully.' })
  @ApiResponse({ status: _404, description: 'User not found.' })
  async tanantUserRegistration(
    @Request() req,
    @Body() masterUserRegistertDTO: MasterUserRegistertDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const tanant = await this.authService.getTanantById(req.user.tanant_id);
      const user = await this.authService.tanantUserRegistration(
        masterUserRegistertDTO,
        tanant.db_name,
        i18n
      );
      return successResponse(_200, i18n.t(`lang.auth.tanant.register`), user);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Public()
  @Post('tanant/login')
  @ApiResponse({
    status: _200,
    description: 'Master user logged in successfully.',
  })
  @ApiResponse({ status: _401, description: 'Invalid email or password.' })
  async masterLogin(
    @Body() loginDto: LoginDto,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.authService.signIn(loginDto);
      if (user) {
        return successResponse(_200, i18n.t(`lang.auth.tanant.login`), user);
      }
      throw new NotFoundException(i18n.t(`lang.auth.login_credential_faild`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @Public()
  @Post('staff/login')
  @ApiResponse({
    status: _200,
    description: 'Master user logged in successfully.',
  })
  @ApiResponse({ status: _401, description: 'Invalid email or password.' })
  async tanantUserLogin(
    @Headers('x-tenant-id') tanantid: string,
    @Body() loginDto: UserLoginDto,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {

      const tanant = await this.authService.getTanantBySubdomain(
        tanantid,
        true,
      );

      if (tanant) {
        const user = await this.authService.tanantUserLogin(loginDto, tanant,i18n);

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

      }
      throw new NotFoundException(i18n.t(`lang.auth.login_credential_faild`));
    } catch (error) {
      errorResponse(error);
    }
  }


  @Public()
  @Post('staff/send_otp')
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
      const user = await this.authService.sendOtp(
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
  @Post('staff/verify_otp')
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
      const user = await this.authService.verifyOtp(verifyOtp, db_name,i18n);

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
  @Post('staff/forgot_password')
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
      const user = await this.authService.forgotPassword(
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
  @Post('staff/reset_password')
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
      const user = await this.authService.resetPassword(
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

  @Post('staff/change_password')
  @ApiResponse({ status: _200, description: 'Password updated successfully.' })
  @ApiResponse({ status: _401, description: 'Unauthorized.' })
  async changePassword(
    @Body() changePasswordDto: StaffChangePasswordDto,
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.authService.changePassword(
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
      throw new BadRequestException(i18n.t(`lang.auth.change_password_fail`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @NoAuthRequire()
  @Get('staff')
    @ApiResponse({ status: _200, description: 'User getting successfully.' })
  @ApiResponse({ status: _401, description: 'Unauthorized' })
  async getUser(@Request() req, @I18n() i18n: I18nContext) {
    try {
      const user = await this.authService.getTenantProfile(req.user.id, req.user.db_name)
      return successResponse(_200, i18n.t(`lang.auth.user_fetch`), user);
    } catch (error) {
      errorResponse(error);
    }
  }

  @NoAuthRequire()
  @Get('staff_list')
  @Permission('user.view')
  @ApiResponse({ status: _200, description: 'User getting successfully.' })
  @ApiResponse({ status: _401, description: 'Unauthorized' })
  async getUserList(@Request() req, @I18n() i18n: I18nContext) {
    try {
      const user = await this.authService.getStaffList(
        req.user.id,
        req.user.store_id,
        req.user.is_admin,
        req.user.db_name,
        i18n
      );
      return successResponse(_200, i18n.t(`lang.auth.user_fetch`), user);
    } catch (error) {
      errorResponse(error);
    }
  }

  @NoAuthRequire()
  @Get('tanant/status/update')
  @ApiResponse({
    status: 200,
    description: 'Tanant status updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Tanant not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTanantStatus(
    @Query('subdomain') subdomain: string,
    @Query('is_active') isActive: boolean,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const tanant = await this.authService.getTanantBySubdomain(subdomain);
      if (tanant) {
        await this.authService.updateTanantStatus(subdomain, isActive);
        return successResponse(_200, i18n.t('lang.auth.tanant.status_updated'));
      }
      throw new NotFoundException(i18n.t(`lang.auth.tanant.not_found`));
    } catch (error) {
      return errorResponse(error);
    }
  }

  @NoAuthRequire()
  @Delete('tanant/delete')
  @Permission('user.delete')
  @ApiResponse({ status: 200, description: 'Tanant deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Tanant not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteTanant(
    @Query('subdomain') subdomain: string,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const tanant = await this.authService.getTanantBySubdomain(subdomain); 
      if (tanant) {
        await this.authService.deleteTanant(subdomain);
        return successResponse(_200, i18n.t('lang.auth.tanant.deleted'));
      }
      throw new NotFoundException(i18n.t('lang.auth.tanant.not_found'));
    } catch (error) {
      return errorResponse(error);
    }
  }
  @Delete('staff/delete')
  @Permission('user.delete')
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteStaff(
    @Request() req: any,
    @Body() body: StaffDeleteDto,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const DeletedStaff = await this.authService.deleteStaff(
        body.id,
        req.user.db_name,
        i18n
      );
      return successResponse(_200, i18n.t(`lang.auth.satff_delete`), DeletedStaff);
    } catch (error) {
      return errorResponse(error);
    }
  }
  @Patch('staff/update')
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateStaff(
    @Request() req: any,
    @Body() body: UpdateStaffDTO,
    @I18n() i18n: I18nContext,
  ) {
    try {
      // if (body.id == req.user.id) {
      //   throw new HttpException(
      //     { status: _401, message: 'Not allowed to update your self' },
      //     _401,
      //   );
      // }
      const UpdatedStaff = await this.authService.updateStaff(
        body,
        req.user.db_name,
      );
      return successResponse(_200, i18n.t(`lang.auth.staff_update`), UpdatedStaff);
    } catch (error) {
      return errorResponse(error);
    }
  }
  @Post('staff/getstaff')
  @Permission('user.view')
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStaff(
    @Request() req: any,
    @Body() body: StaffGetDto,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const Staff = await this.authService.getStaff(
        req.user.id,
        req.user.store_id,
        body.search_key,
        req.user.db_name,
      );
      return successResponse(_200, i18n.t(`lang.auth.staff_getstaff`), Staff);
    } catch (error) {
      return errorResponse(error);
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
      const user = await this.authService.signOut(
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
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Request,
} from '@nestjs/common';
import { GoldLoanService } from './gold_loan.service';
import { Public } from 'src/decorators/public.decorator';
import { _200, _400 } from 'src/utils/http-code.util';
import { I18n, I18nContext } from 'nestjs-i18n';
import {
  errorResponse,
  PromiseResponse,
  successResponse,
} from 'src/utils/response.util';
import {
  PriceCofigDTO,
  AssetDetails,
  RenewalDetails,
  GetPriceConfig,
} from './dto/price_config.dto';
import {
  CustomerIniatialLoanEstimationDTO,
  CustomerKycVerificationDto,
  GetCustomerKycVerificationDto,
  KycApprovedDisapprovedStatusDto,
} from './dto/customer_loan_estimation.dto';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminConfigService } from './price_config.service';
import { CreateTagDTO, TagDTO } from './dto/tag.dto';
import { TagService } from './tag.service';
import { AuthService } from '../auth/auth.service';
import { Permission } from 'src/decorators/permission.decorator';

@ApiTags('Loan')
@Controller('gold_loan')
@ApiBearerAuth()
export class GoldLoanController {
  constructor(
    private readonly goldLoanService: GoldLoanService,
    private readonly adminConfigService: AdminConfigService,
    private readonly tagService: TagService,
    private readonly authService: AuthService,
  ) {}

  @Post('tag')
  @ApiResponse({ status: _200, description: 'Tag added successfully.' })
  async addTagConfig(
    @Request() req,
    @Body() createTagDTO: CreateTagDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const tag = await this.tagService.addTag(
        createTagDTO,
        req.user.id,
        req.user.db_name,
      );
      if (tag.message === i18n.t(`lang.gold_loan.tag_exists`)) {
        throw new BadRequestException(i18n.t(`lang.gold_loan.tag_exists`));
      }
      return successResponse(_200, i18n.t(`lang.gold_loan.tag_update`), tag);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('tag')
  @ApiResponse({ status: _200, description: 'Tag retrieved successfully.' })
  async getTags(
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const tag = await this.tagService.getAllTags(req.user.db_name);
      return successResponse(
        _200,
        i18n.t(`lang.gold_loan.tag_retrieve_success`),
        tag,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Delete('tag')
  @ApiResponse({ status: _200, description: 'Tag deleted successfully.' })
  async deleteTag(
    @Request() req,
    @Body() tagDTO: TagDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const tag = await this.tagService.deleteTag(
        tagDTO,
        req.user.id,
        req.user.db_name,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.gold_loan.tag_deleted`),
        tag.data,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('loan_config')
  @Permission('priceTag.maker', 'priceTag.checker', 'priceTag.approver')
  @ApiResponse({
    status: _200,
    description: 'Admin loan config added successfully.',
  })
  async addAdminConfig(
    @Request() req,
    @Body() priceCofigDTO: PriceCofigDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const loan_config = await this.adminConfigService.addAdminConfig(
        priceCofigDTO,
        req.user.id,
        req.user.db_name,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.gold_loan.config_success`),
        loan_config,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('fetch/loan_config')
  @ApiResponse({
    status: _200,
    description: 'Admin loan config retrieved successfully.',
  })
  async getAdminConfig(
    @Request() req,
    @Body() getPriceConfig: GetPriceConfig,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const loan_config = await this.adminConfigService.getAdminConfig(
        getPriceConfig,
        req.user.id,
        req.user.db_name,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.gold_loan.loan_config_success`),
        loan_config,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('price_config_log')
  @ApiResponse({
    status: _200,
    description: 'Admin loan config retrieved successfully.',
  })
  async getPriceConfigLog(
    @Request() req,
    @Query('tag_id') tag_id: string,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const loan_config = await this.adminConfigService.getPriceConfigLog(
        tag_id,
        req.user.db_name,
      );
      return successResponse(
        _200,
        i18n.t(`lang.gold_loan.loan_config_success`),
        loan_config,
      );
    } catch (error) {
      errorResponse(error.message);
    }
  }

  @Post('loan_calculator')
  @ApiResponse({
    status: _200,
    description: 'User gold loan valuation added successfully.',
  })
  async goldLoanCalculator(
    @Request() req,
    @Body() assetDetails: AssetDetails,
    @I18n() i18n: I18nContext,
    @Query('customer_id') customer_id?: string,
    @Query('appointment_id') appointment_id?: string,
  ): Promise<PromiseResponse> {
    try {
      let customerId: string;
      if (customer_id) {
        customerId = customer_id;
      } else {
        customerId = req.user.id;
      }
      const user = await this.goldLoanService.customerInitialGoldValuation(
        assetDetails,
        customerId,
        i18n,
        req.user.db_name,
        appointment_id,
        req.user.id,
        req.user.store_id,
      );

      if (user) {
        return successResponse(
          _200,
          i18n.t(`lang.gold_loan.loan_calculation_success`),
          user,
        );
      }
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('valuation_list')
  @ApiResponse({
    status: _200,
    description: 'User Valuations retrieved successfully.',
  })
  async getCustomerGoldValuations(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Body('customer_id') customer_id?: string,
  ): Promise<PromiseResponse> {
    try {
      let customerId: string;
      if (customer_id) {
        customerId = customer_id;
      } else {
        customerId = req.user.id;
      }
      const user = await this.goldLoanService.getCustomerGoldValuations(
        customerId,
        i18n,
        req.user.db_name,
      );
      if (user) {
        return successResponse(
          _200,
          i18n.t(`lang.gold_loan.user_valuations`),
          user,
        );
      }
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('delete_valuation')
  @ApiResponse({
    status: _200,
    description: 'User Valuations deleted successfully.',
  })
  async deleteCustomerGoldValuations(
    @Headers('x-tenant-id') tenantId: string,
    @Request() req,
    @Body()
    customerIniatialLoanEstimationDTO: CustomerIniatialLoanEstimationDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );
      const user = await this.goldLoanService.deleteCustomerGoldValuations(
        customerIniatialLoanEstimationDTO,
        req.user.id,
        db_name,
        i18n,
      );
      if (user) {
        return successResponse(
          _200,
          i18n.t(`lang.gold_loan.valuation_deleted`),
          user.data,
        );
      }
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('initial_transaction_details')
  @ApiResponse({
    status: _200,
    description: 'User Valuations deleted successfully.',
  })
  async getInitialCustomerGoldValuations(
    @Headers('x-tenant-id') tenantId: string,
    @Request() req,
    @Body()
    customerIniatialLoanEstimationDTO: CustomerIniatialLoanEstimationDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );
      const user = await this.goldLoanService.getInitialCustomerGoldValuations(
        customerIniatialLoanEstimationDTO,
        req.user.id,
        db_name,
        i18n,
      );
      if (user) {
        return successResponse(
          _200,
          i18n.t(`lang.gold_loan.user_valuations`),
          user.data,
        );
      }
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('kyc_data')
  @ApiResponse({
    status: _200,
    description: 'Kyc details updated successfully.',
  })
  async kycVerification(
    @Request() req,
    @Body() customerKycVerificationDto: CustomerKycVerificationDto,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {

      const user = await this.goldLoanService.kycVerification(
        customerKycVerificationDto,
        req.user.db_name,
        customerKycVerificationDto.customer_id,
        i18n,
      );
      if (user) {
        return successResponse(_200, i18n.t(`lang.kyc.kyc_success`), user);
      } else {
        throw new NotFoundException(i18n.t(`lang.kyc.kyc_failed`));
      }
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('get_kyc_data')
  @ApiResponse({
    status: _200,
    description: 'Kyc details retrieved successfully.',
  })
  async getKycVerificationDetails(
    @Request() req,
    @Body() getCustomerKycVerificationDto: GetCustomerKycVerificationDto,
    @Headers('x-tenant-id') tenantId: string,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {

      const user = await this.goldLoanService.getKycVerificationDetails(
        getCustomerKycVerificationDto.customer_id,
        req.user.db_name,
        i18n,
      );
      if (user) {
        return successResponse(_200, i18n.t(`lang.kyc.user_kyc`), user);
      }
      throw new NotFoundException(i18n.t(`lang.kyc.kyc_failed`));
    } catch (error) {
      errorResponse(error);
    }
  }


  @Post('kyc_approved_disapproved')
  @ApiResponse({
    status: _200,
    description: 'Kyc details retrieved successfully.',
  })
  async KycApprovedDisapprovedStatus(
    @Request() req,
    @Body() kycApprovedDisapprovedStatusDto: KycApprovedDisapprovedStatusDto,
    @Headers('x-tenant-id') tenantId: string,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
  
      const user = await this.goldLoanService.KycApprovedDisapprovedStatus(
        kycApprovedDisapprovedStatusDto,
        req.user.db_name,
        i18n,
      );
      if (user) {
        return successResponse(_200, i18n.t(`lang.kyc.kyc_approved_disapproved_success`), user);
      }
      throw new NotFoundException(i18n.t(`lang.kyc.kyc_approved_disapproved_failed`));
    } catch (error) {
      errorResponse(error);
    }
  }


  @Get('customer_kyc_details')
  @ApiResponse({
    status: _200,
    description: 'Kyc details retrieved successfully.',
  })
  async getAllKycVerificationDetails(
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.goldLoanService.getAllKycVerificationDetails(
        req.user.id,
        req.user.db_name,
        i18n,
      );
      if (user) {
        return successResponse(_200, i18n.t(`lang.kyc.user_kyc`), user);
      }
      throw new NotFoundException(i18n.t(`lang.kyc.kyc_failed`));
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('renewal')
  @ApiResponse({
    status: _200,
    description: 'Admin Config added successfully.',
  })
  async goldLoanRenewal(
    @Request() req,
    @Body() renewalDetails: RenewalDetails,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.goldLoanService.goldLoanRenewal(
        req.user.id,
        renewalDetails,
        req.user.db_name,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.gold_loan.loan_calculation_success`),
        user,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('valuation_details')
  @ApiResponse({
    status: _200,
    description: 'Admin Config added successfully.',
  })
  async getStoreAllValuationDetails(
    @Request() req,
    @Query('valuation_type') valuation_type: string,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.goldLoanService.getStoreAllValuationDetails(
        valuation_type,
        req.user.store_id,
        req.user.db_name,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.gold_loan.user_valuations`),
        user,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('liquidity_details')
  @ApiResponse({
    status: _200,
    description: 'Admin Config added successfully.',
  })
  async getAllValuationDetails(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Query('search') search: string,
    @Query('type') type?: number,
  ): Promise<PromiseResponse> {
    try {
      const user = await this.goldLoanService.getValuations(
        req.user.db_name,
        i18n,
        search,
        req.user?.store_id,
        type,
      );
      return successResponse(
        _200,
        i18n.t(`lang.gold_loan.user_valuations`),
        user,
      );
    } catch (error) {
      errorResponse(error);
    }
  }
}

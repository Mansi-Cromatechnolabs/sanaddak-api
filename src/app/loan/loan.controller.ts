import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { LoanCloserDto, LoanDTO } from './dto/loan.dto';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { _200 } from 'src/utils/http-code.util';
import { I18n, I18nContext } from 'nestjs-i18n';
import {
  errorResponse,
  PromiseResponse,
  successResponse,
} from 'src/utils/response.util';
import {
  GetLoanDTO,
  UpdateLoanDTO,
  UpdateLoanStatus,
} from './dto/update_loan.dto';
import { EmiWeiveDTO } from './dto/loan_emi.dto';
import { LoanService } from './service/loan.service';
import { LoanInstallmentService } from './service/loan_emi.service';
import { GoldItemService } from './service/gold_item.service';
import { BarcodeService } from './service/barcode.service';
import { AssignBarcodeDTO, DisputeGenerateDTO } from './dto/barcode_master.dto';
import { VerifyGoldItem } from './dto/debit_credit_notes.dto';

@ApiTags('Loan')
@Controller('loan')
@ApiBearerAuth()
export class LoanController {
  constructor(
    private readonly loanService: LoanService,
    private readonly loanInstallmentService: LoanInstallmentService,
    private readonly goldItemService: GoldItemService,
    private readonly barcodeService: BarcodeService,
  ) {}

  @Post()
  @ApiResponse({ status: 200, description: 'Loan applied successfully.' })
  async addLoan(
    @Request() req,
    @Body() loanDTO: LoanDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.loanService.applyLoan(
        loanDTO,
        req.user.id,
        req.user.db_name,
        req.user.store_id,
        i18n,
      );
      return successResponse(200, i18n.t(`lang.loan.loan_apply`), loan);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Patch()
  @ApiResponse({
    status: _200,
    description: 'Loan status updated successfully.',
  })
  async updateLoan(
    @Request() req,
    @Body() updateLoanDTO: UpdateLoanDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.loanService.updateLoanStatus(
        req.user.db_name,
        updateLoanDTO,
        i18n,
        req.user.id,
        req.user.store_id,
      );
      return successResponse(
        _200,
        i18n.t(`lang.loan.loan_status_updated`),
        loan,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('customer_portfolio')
  @ApiResponse({
    status: _200,
    description: 'Loan list retrieved successfully.',
  })
  async getLoanList(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Query('customer_id') customer_id?: string,
    @Query('loan_id') loan_id?: string,
  ): Promise<PromiseResponse> {
    let customerId: string;
    if (customer_id) {
      customerId = customer_id;
    } else {
      customerId = req.user.id;
    }
    try {
      const loan = await this.loanService.getLoanList(
        req.user.db_name,
        customerId,
        i18n,
        loan_id,
      );
      return successResponse(
        _200,
        i18n.t(`lang.loan.loan_details_retrieve`),
        loan,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('loan_list')
  @ApiResponse({
    status: _200,
    description: 'Loan list retrieved successfully.',
  })
  async getAllLoanList(
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.loanService.getAllApprovedLoanList(
        req.user.db_name,
        req.user.store_id,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.loan.loan_details_retrieve`),
        loan,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('extend_details')
  @ApiResponse({
    status: _200,
    description: 'Loan detais retrieved successfully.',
  })
  async getLoandetails(
    @Request() req,
    @Body() getLoandetails: GetLoanDTO,
    @I18n() i18n: I18nContext,
    @Query('customer_id') customer_id?: string,
    @Query('tenure') tenure_in_months?: number,
    @Query('topup_request') topup_request?: number,
  ): Promise<PromiseResponse> {
    let user_id: string;
    if (customer_id) {
      user_id = customer_id;
    } else {
      user_id = req.user.id;
    }
    try {
      const loan = await this.loanService.getExtendLoanDetails(
        req.user.db_name,
        user_id,
        getLoandetails,
        tenure_in_months,
        topup_request,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.loan.loan_details_retrieve`),
        loan,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get()
  @ApiResponse({
    status: _200,
    description: 'Loan detais retrieved successfully.',
  })
  async getPendingLoandetails(
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.loanService.getPendingLoandetails(
        req.user.db_name,
        req.user.id,
        req.user.store_id,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.loan.loan_details_retrieve`),
        loan,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('loan_closer')
  async loanCloserProcess(
    @Request() req,
    @Body() loanCloserDto: LoanCloserDto,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.loanService.loanCloserProcess(
        req.user.db_name,
        loanCloserDto,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.loan.loan_details_retrieve`),
        loan,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Patch('loan_status')
  @ApiResponse({
    status: _200,
    description: 'Loan detais retrieved successfully.',
  })
  async updateLoanStatus(
    @Request() req,
    @Body() updateLoanStatus: UpdateLoanStatus,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.loanService.updateLoanCloserStatus(
        req.user.db_name,
        updateLoanStatus,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.loan.loan_details_retrieve`),
        loan,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('customer_details')
  @ApiResponse({
    status: _200,
    description: 'Customer Loan detais retrieved successfully.',
  })
  async getCustomerLoandetails(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Query('customer_id') customer_id: string,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.goldItemService.getCustomerLoanDetails(
        req.user.db_name,
        customer_id,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.loan.loan_details_retrieve`),
        loan,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('global_search')
  @ApiResponse({
    status: _200,
    description: 'Id found successfully.',
  })
  async getGlobalSearch(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Query('id') id: string,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.goldItemService.getGlobalSearch(
        req.user.db_name,
        id,
        i18n,
      );
      return successResponse(
        _200,
        i18n.t(`lang.loan.loan_details_retrieve`),
        loan,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Patch('penalty_calculate')
  @ApiResponse({
    status: _200,
    description: 'Loan detais retrieved successfully.',
  })
  async penaltyCalculate(
    @Request() req,
    @Query('loan_id') loan_id: string,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.loanInstallmentService.penaltyCalculate(
        loan_id,
        req.user.db_name,
        i18n,
      );
      return successResponse(_200, i18n.t(`lang.loan.loan_emi_updated`), loan);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Patch('waiver_calculate')
  @ApiResponse({
    status: _200,
    description: 'Loan detais retrieved successfully.',
  })
  async weiverCalculate(
    @Request() req,
    @Body() emiWeiveDTO: EmiWeiveDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.loanInstallmentService.weiverCalculate(
        emiWeiveDTO,
        req.user.db_name,
        i18n,
      );
      return successResponse(_200, i18n.t(`lang.loan.loan_emi_updated`), loan);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('generate_barcode')
  @ApiResponse({
    status: _200,
    description: 'Item barcode generated successfully.',
  })
  async printItemBarcode(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Query('type') type: number,
    @Query('liquidity_barcode') liquidity_barcode?: string,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.barcodeService.generateBarcode(
        type,
        req.user.store_id,
        req.user.db_name,
        i18n,
        liquidity_barcode
      );
      return successResponse(_200, i18n.t(`lang.loan.item_barcode`), loan);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('assign_barcode')
  @ApiResponse({
    status: _200,
    description: 'Item barcode generated successfully.',
  })
  async assignBarcode(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Body() assignBarcodeDTO: AssignBarcodeDTO,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.barcodeService.assignBarcode(
        assignBarcodeDTO,
        req.user.db_name,
        i18n,
      );
      return successResponse(_200, i18n.t(`lang.loan.item_barcode`), loan);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('scan_barcode')
  @ApiResponse({
    status: _200,
    description: 'Item barcode generated successfully.',
  })
  async scanBarcode(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Body() assignBarcodeDTO: AssignBarcodeDTO,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.barcodeService.scanBarcode(
        assignBarcodeDTO,
        req.user.db_name,
        i18n,
      );
      return successResponse(_200, i18n.t(`lang.loan.item_barcode`), loan);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('dispute_generate')
  @ApiResponse({
    status: _200,
    description: 'Item barcode generated successfully.',
  })
  async sidpureGenerate(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Body() disputeGenerateDTO: DisputeGenerateDTO,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.barcodeService.disputeGenerate(
        disputeGenerateDTO,
        req.user.id,
        req.user.db_name,
        i18n,
      );
      return successResponse(_200, i18n.t(`lang.loan.item_barcode`), loan);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('verify_gold_piece')
  @ApiResponse({
    status: _200,
    description: 'Item barcode generated successfully.',
  })
  async verifyGoldPieces(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Body() verifyGoldItem: VerifyGoldItem,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.barcodeService.verifyGoldPieces(
        verifyGoldItem,
        req.user.id,
        req.user.db_name,
        i18n,
      );
      return successResponse(_200, i18n.t(`lang.loan.item_barcode`), loan);
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('liquidity_barcode_list')
  @ApiResponse({
    status: _200,
    description: 'Loan detais retrieved successfully.',
  })
  async getAllLoanLists(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Query('liquidity_number') liquidity_number?:string
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.barcodeService.getAllLoanLists(
        req.user.db_name,
        i18n,
        req.user.store_id,
        liquidity_number,
      );
      return successResponse(
        _200,
        i18n.t(`lang.loan.loan_details_retrieve`),
        loan,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get('gold_valuation_report')
  @ApiResponse({
    status: _200,
    description: 'Loan detais retrieved successfully.',
  })
  async geGoldValuationReport(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Query('liquidity_number') liquidity_number?:string
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.barcodeService.geGoldValuationReport(
        req.user.db_name,
        i18n,
        liquidity_number,
      );
      return successResponse(
        _200,
        i18n.t(`lang.loan.loan_details_retrieve`),
        loan,
      );
    } catch (error) {
      errorResponse(error);
    }
  }
}

import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoanPaymentTransactionService } from './loan_payment_transaction.service';
import { LoanPaymentTransactionDTO } from './dto/loan_payment_transaction.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import {
  errorResponse,
  PromiseResponse,
  successResponse,
} from 'src/utils/response.util';

@ApiTags('Loan Payment Transaction')
@Controller('loan_payment_transaction')
@ApiBearerAuth()
export class LoanPaymentTransactionController {
  constructor(
    private readonly loanPaymentTransactionService: LoanPaymentTransactionService,
  ) {}

  @Post()
  @ApiResponse({
    status: 200,
    description: 'Loan transaction applied successfully.',
  })
  async addTransaction(
    @Request() req,
    @Body() loanPaymentTransactionDTO: LoanPaymentTransactionDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.loanPaymentTransactionService.addTransaction(
        loanPaymentTransactionDTO,
        req.user.id,
        req.user.store_id,
        req.user.db_name,
        i18n,
      );
      return successResponse(
        200,
        i18n.t(`lang.loan.loan_transaction_added`),
        loan,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Loan transaction retrieved successfully.',
  })
  async getTransactions(
    @Request() req,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const loan = await this.loanPaymentTransactionService.getTransactions(
        req.user.db_name,
        req.user.id,
        req.user.store_id,
        i18n
      );
      return successResponse(200, i18n.t(`lang.loan.loan_transactions`), loan);
    } catch (error) {
      errorResponse(error);
    }
  }
}

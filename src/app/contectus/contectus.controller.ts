import { Body, Controller, Get, Headers, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { _200, _201 } from 'src/utils/http-code.util';
import { errorResponse, successResponse } from 'src/utils/response.util';
import { ContactUsDto } from './dtos/contextus.dto';
import { ContectusService as ContactsService } from './contectus.service';
import { Public } from 'src/decorators/public.decorator';
import { ContactDetailsDto } from './dtos/contactDetails.dto';
import { GetContactDetailsDto } from './dtos/getContact.dto';
import { deleteContactDetailsDto } from './dtos/deleteContactDetails.dto';
import { AuthService } from '../auth/auth.service';

@ApiTags('Contact Us')
@Controller('contactus')
@ApiBearerAuth()
export class ContectUsController {
  constructor(
    private readonly contacts: ContactsService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('contact_us')
  @ApiResponse({
    status: _201,
  })
  async getInformation(
    @Headers('x-tenant-id') tenantId: string,
    @Request() req,
    @I18n() i18n: I18nContext,
    @Body() body: ContactUsDto,
  ) {
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );
      const newTicket = await this.contacts.CreateTicketContactUs(
        body,
        db_name,
      );
      return successResponse(
        _200,
        i18n.t('lang.contact_us.new_support_request'),
        newTicket,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('get_support')
  @ApiResponse({
    status: _201,
  })
  async getSupport(
    @Request() req,
    @I18n() i18n: I18nContext,
    @Body() body: ContactUsDto,
  ) {
    try {
      const newTicket = await this.contacts.CreateTicketSupport(
        body,
        req.user.id,
        req.user.db_name,
      );
      return successResponse(
        _200,
        i18n.t('lang.contact_us.new_support_request'),
        newTicket,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('setContactDetails')
  @ApiResponse({
    status: _201,
  })
  async setContactInformation(
    @Headers('x-tenant-id') tenantId: string,
    @I18n() i18n: I18nContext,
    @Body() body: ContactDetailsDto,
  ) {
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );
      const newDetails = await this.contacts.AddContectDetails(body, db_name);

      return successResponse(
        _200,
        i18n.t('lang.contact_us.set_support_details'),
        newDetails,
      );
    } catch (error) {
      errorResponse(error);
    }
  }
  @Post('ContactDetails')
  @ApiResponse({
    status: _200,
  })
  async getContactInformation(
    @Headers('x-tenant-id') tenantId: string,
    @I18n() i18n: I18nContext,
    @Body() body: GetContactDetailsDto,
  ) {
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );
      const ContectDetails = await this.contacts.GetContectDetails(
        body,
        db_name,
      );
      return successResponse(
        _200,
        i18n.t('lang.contact_us.get_contact_details'),
        ContectDetails,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('deleteContactDetails')
  @ApiResponse({
    status: _201,
  })
  async DeleteContactInformation(
    @Headers('x-tenant-id') tenantId: string,
    @I18n() i18n: I18nContext,
    @Body() body: deleteContactDetailsDto,
  ) {
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );
      const DeletedContectDetails = await this.contacts.DeleteContectDetails(
        body,
        db_name,
      );
      return successResponse(
        _200,
        i18n.t('lang.contact_us.delete_contact_details'),
        DeletedContectDetails,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Post('updateContactDetails')
  @ApiResponse({
    status: _201,
  })
  async UpdateContactInformation(
    @Headers('x-tenant-id') tenantId: string,
    @I18n() i18n: I18nContext,
    @Body() body: deleteContactDetailsDto,
  ) {
    try {
      const { db_name } = await this.authService.getTanantBySubdomain(
        tenantId,
        true,
      );
      const UpdatedContectDetails = await this.contacts.updateContectDetails(
        body,
        db_name,
      );
      return successResponse(
        _200,
        i18n.t('lang.contact_us.update_contact_details'),
        UpdatedContectDetails,
      );
    } catch (error) {
      errorResponse(error);
    }
  }
}

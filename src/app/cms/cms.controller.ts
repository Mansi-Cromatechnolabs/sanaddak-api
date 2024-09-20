import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { errorResponse, PromiseResponse, successResponse } from "src/utils/response.util";
import { BadRequestException, Body, Controller, Delete, Get, Headers, NotFoundException, Patch, Post, Req, Request } from '@nestjs/common';
import { I18n, I18nContext } from "nestjs-i18n";
import { _200, _201, _400 } from "src/utils/http-code.util";
import { CmsService } from "./cms.service";
import { Public } from "src/decorators/public.decorator";
import { AuthService } from "../auth/auth.service";
import { StoreHolidayService } from "../appointment/services/store_holiday.service";
import { AddCmsDTO, DeleteCmsDTO, GetCmsDTO, UpdateCmsDTO } from "./dto/cms.dto";
import { UpdateStoreHolidayDTO } from "../appointment/dto/holiday.dto";


@ApiTags('CMS')
@Controller('cms')
@ApiBearerAuth()
export class CmsController {
    constructor(
        private readonly cmsService: CmsService,
        private readonly authService: AuthService,

    ) { }

    @Public()
    @Post()
    @ApiResponse({ status: _200, description: 'cms added successfully.' })
    async addCms(
        @Headers('x-tenant-id') tenantId: string,
        @Request() req,
        @Body() addCmsDTO: AddCmsDTO,
        @I18n() i18n: I18nContext,
    ): Promise<PromiseResponse> {
        const { db_name } = await this.authService.getTanantBySubdomain(tenantId, true);
        try {
            const cms = await this.cmsService.addCms(
                addCmsDTO,
                db_name,
            );
            return successResponse(
                _200,
                i18n.t(`lang.cms.register`),
                cms,
            );
        } catch (error) {
            errorResponse(error);
        }
    }


    @Public()
    @Post('cms_details')
    @ApiResponse({
        status: _200, description: 'Get Cms successfully.'
    })
    async getCmsInformation(
        @Headers('x-tenant-id') tenantId: string,
        @I18n() i18n: I18nContext,
        @Body() getCmsDTO:GetCmsDTO,
    ) {
        try {
            const { db_name } = await this.authService.getTanantBySubdomain(tenantId, true);
            const cms = await this.cmsService.GetCmsDetails(getCmsDTO, db_name);
            if(cms){
                return successResponse(_200,
                    i18n.t('lang.cms.get_cms_details'),
                    cms,
                );
            }
            throw new NotFoundException(i18n.t(`lang.cms.page_type_not_found`));
        } catch (error) {
            errorResponse(error);
        }
    }
    
    @Public()
    @Patch()
    @ApiResponse({
        status: _200, description: 'Cms updated successfully.'
    })
    async UpdateCmsInformation(
        @Headers('x-tenant-id') tenantId: string,
        @I18n() i18n: I18nContext,
        @Body() updateCmsDTO: UpdateCmsDTO,
    ) {
        try {
            const { db_name } = await this.authService.getTanantBySubdomain(tenantId, true);
            const cms = await this.cmsService.updateCmsDetails(updateCmsDTO, db_name,i18n);
            return successResponse(_200,
                i18n.t('lang.cms.update_cms_details'),
                cms,
            );
        } catch (error) {
            errorResponse(error);
        }
    }

    @Public()
    @Delete()
    @ApiResponse({ status: _200, description: 'Cms deleted successfully.' })
    async deleteStoreHoliday(
        @Headers('x-tenant-id') tenantId: string,
        @I18n() i18n: I18nContext,
        @Body() deleteCmsDTO: DeleteCmsDTO,
    ): Promise<PromiseResponse> {
        try {
            const { db_name } = await this.authService.getTanantBySubdomain(tenantId, true);
            const cms = await this.cmsService.deleteCmsDetails(deleteCmsDTO, db_name);
            return successResponse(
                _200,
                i18n.t(`lang.cms.delete_success`),
                cms.data,
            );
        } catch (error) {
            errorResponse(error);
        }
    }
  
}
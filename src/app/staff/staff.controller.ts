import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { errorResponse, PromiseResponse, successResponse } from "src/utils/response.util";
import { BadRequestException, Body, Controller, Delete, Get, Headers, NotFoundException, Post, Req, Request } from '@nestjs/common';
import { I18n, I18nContext } from "nestjs-i18n";
import { _200 } from "src/utils/http-code.util";
import {StaffService } from "./staff.service";
import { StaffRegistertDTO } from "./dto/registration.dto";
import { Public } from "src/decorators/public.decorator";
import { AuthService } from "../auth/auth.service";
import { StoreHolidayService } from "../appointment/services/store_holiday.service";


// @ApiTags('Staff')
@Controller('staff')
@ApiBearerAuth()
export class StaffController {
    constructor(
        private readonly staffService:StaffService,
        private readonly authService: AuthService,
    ) { }

    @Public()
    @Post('sign_up')
    @ApiResponse({ status: _200, description: 'New user Registered.' })
    async userRegistration(
        @Headers('x-tenant-id') tenantId: string,
        @Body() staffRegistertDTO: StaffRegistertDTO,
        @I18n() i18n: I18nContext,
    ): Promise<PromiseResponse> {
        const tanant = await this.authService.getTanantBySubdomain(tenantId, true);
        try {
            const user = await this.staffService.staffRegistration(
                staffRegistertDTO,
                tanant.db_name,
                // tanant,
            );
            return successResponse(_200, i18n.t(`lang.auth.new_user_register`), user);
        } catch (error) {
            errorResponse(error);
        }
    }
  
}
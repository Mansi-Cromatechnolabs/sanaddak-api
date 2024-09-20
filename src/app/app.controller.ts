import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { successResponse, errorResponse, PromiseResponse } from 'src/utils/response.util';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ApiResponse } from '@nestjs/swagger';
import { infoLog } from 'src/utils/log.util';
import { _YYYYMMDD } from 'src/utils/date.util';
import { _200 } from 'src/utils/http-code.util';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get('hello')
    @ApiResponse({ status: _200, description: 'Getting welcome message successfully' })
    async getHello(@I18n() i18n: I18nContext): PromiseResponse {
        try {
            let data = await this.appService.getHello();
            infoLog('Log coming');
            return successResponse(i18n.t(`lang.welcome_message`), data);
        } catch (error) {
            errorResponse(error);
        }
    }

    @Get('favicon.ico')
    getFavicon() { }

}

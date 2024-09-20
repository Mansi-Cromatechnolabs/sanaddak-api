import {
  Controller,
  Patch,
  Headers,
  Body,
  Request,
  Get,
  Post,
} from '@nestjs/common';
import { GlobalConfigService } from './global_config.service';
import { Public } from 'src/decorators/public.decorator';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { _200 } from 'src/utils/http-code.util';
import { I18n, I18nContext } from 'nestjs-i18n';
import {
  errorResponse,
  PromiseResponse,
  successResponse,
} from 'src/utils/response.util';
import { GetGlobalConfig, GlobalConfigDTO } from './dto/global_config.dto';
import { AuthService } from '../auth/auth.service';

@ApiTags('GlobalConfig')
@Controller('global_config')
@ApiBearerAuth()
export class GlobalModuleController {
  constructor(private readonly globalConfigService: GlobalConfigService,
    private readonly authService: AuthService
  ) {}

  @Patch()
  @ApiResponse({
    status: _200,
    description: 'Global config updated successfully.',
  })
  async addGlobalConfig(
    @Request() req,
    @Body() globalConfigDTO: GlobalConfigDTO,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const updatedConfig = await this.globalConfigService.addGlobalConfig(
        globalConfigDTO,
        req.user.id,
        req.user.db_name,
      );
      return successResponse(
        _200,
        i18n.t(`lang.global_config.config_success`),
        updatedConfig,
      );
    } catch (error) {
      errorResponse(error);
    }
  }

  @Public()
  @Post()
  @ApiResponse({
    status: _200,
    description: 'Global config retrived successfully.',
  })
  async getGlobalConfig(
    @Headers('x-tenant-id') tenantId: string,
    @Body() getGlobalConfig: GetGlobalConfig,
    @I18n() i18n: I18nContext,
  ): Promise<PromiseResponse> {
    try {
      const {db_name} = await this.authService.getTanantBySubdomain(tenantId,true);
      const globalConfig = await this.globalConfigService.getGlobalConfig(
        getGlobalConfig,
        db_name,
        i18n
      );
      return successResponse(
        _200,
        i18n.t(`lang.global_config.config_retrieve_success`),
        globalConfig,
      );
    } catch (error) {
      errorResponse(error);
    }
  }
}

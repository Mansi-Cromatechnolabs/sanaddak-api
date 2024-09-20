import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request } from '@nestjs/common';
import { SettingService } from './setting.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { _200 } from 'src/utils/http-code.util';
import { PromiseResponse, errorResponse, successResponse } from 'src/utils/response.util';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ListUserQuery } from '../user/dto/list-user-query.dto';
import { Permission } from 'src/decorators/permission.decorator';

@ApiTags('Setting')
@Controller('setting')
@ApiBearerAuth()
export class SettingController {
    constructor(private readonly settingService: SettingService) { }

    @Post()
    @Permission('setting.create')
    @ApiResponse({ status: _200, description: 'Setting created successfully.' })
    async create(@Body() createSettingDto: CreateSettingDto, @I18n() i18n: I18nContext): Promise<PromiseResponse> {
        try {
            const setting = this.settingService.create(createSettingDto);
            return successResponse(_200,i18n.t(`lang.setting.create`), setting);
        } catch (error) {
            errorResponse(error);
        }
    }

    @Get()
    @Permission('setting.list')
    @ApiResponse({ status: _200, description: 'Setting list getting successfully.' })
    async findAll(@Query() queryParams: ListUserQuery, @I18n() i18n: I18nContext): PromiseResponse {
        try {
            const data = await this.settingService.findAll(queryParams);
            return successResponse(_200,i18n.t(`lang.setting.list`), data);
        } catch (error) {
            errorResponse(error);
        }
    }

    @Get(':id')
    @Permission('setting.view')
    @ApiResponse({ status: _200, description: 'Setting getting successfully.' })
    async findOne(@Param('id') id: string, @I18n() i18n: I18nContext): PromiseResponse {
        try {
            let data = await this.settingService.findOne(id);
            return successResponse(_200,i18n.t(`lang.setting.single`), data);
        } catch (error) {
            errorResponse(error);
        }
    }

    @Put(':id')
    @Permission('setting.edit')
    @ApiResponse({ status: _200, description: 'Setting updated successfully.' })
    async update(@Param('id') id: string, @Body() updateSettingDto: UpdateSettingDto, @I18n() i18n: I18nContext): PromiseResponse {
        try {
            let data = await this.settingService.update(id, updateSettingDto);
            return successResponse(_200,i18n.t(`lang.setting.update`), data);
        } catch (error) {
            errorResponse(error);
        }
    }

    @Delete(':id')
    @Permission('setting.delete')
    @ApiResponse({ status: _200, description: 'Setting deleted successfully.' })
    async remove(@Param('id') id: string, @I18n() i18n: I18nContext): PromiseResponse {
        try {
            await this.settingService.remove(id);
            return successResponse(i18n.t(`lang.setting.delete`));
        } catch (error) {
            errorResponse(error);
        }
    }
}

import { Injectable } from '@nestjs/common';
import { Setting, SettingSchema } from './setting.schema';
import { Model } from 'mongoose';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { getTanantDbName } from 'src/utils/helper';

@Injectable()
export class SettingService {
    public settingModel: Model<any>;

    private async getSettingModel(): Promise<Model<any>> {
        let db_name = await getTanantDbName();
        if (!this.settingModel || this.settingModel.db.name !== db_name) {
            this.settingModel = await setTanantConnection(db_name, 'Setting', SettingSchema);
        }
        return this.settingModel;
    }

    async create(createSettingDto: CreateSettingDto): Promise<Setting> {
        const settingModel = await this.getSettingModel();
        const createdSetting = new settingModel(createSettingDto);
        return createdSetting.save();
    }

    async findAll(queryParams): Promise<Setting[]> {
        const settingModel = await this.getSettingModel();
        const settings = await settingModel.find().exec();
        return settings.map(setting => ({
            id: setting._id,
            key: setting.key,
            value: setting.value,
        }));
    }

    async findOne(id: string) {
        const settingModel = await this.getSettingModel();
        const setting = await settingModel.findById(id).exec();
        return {
            "id": setting.id,
            'key': setting.key,
            'value': setting.value,
        }
    }

    async update(id: string, updateSettingDto: UpdateSettingDto): Promise<Setting> {
        const settingModel = await this.getSettingModel();
        return await settingModel.findByIdAndUpdate(id, updateSettingDto, { new: true }).exec();
    }

    async remove(id: string): Promise<Setting> {
        const settingModel = await this.getSettingModel();
        return await settingModel.findByIdAndDelete(id).exec();
    }
}

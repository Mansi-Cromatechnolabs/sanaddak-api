import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Model } from 'mongoose';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400 } from 'src/utils/http-code.util';
import { bcryptPassword } from 'src/utils/helper';
import { Cms, CmsSchema } from './schema/cms.schema';
import { AddCmsDTO, DeleteCmsDTO, GetCmsDTO, UpdateCmsDTO } from './dto/cms.dto';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';

@Injectable()
export class CmsService {

    public cmsModel: Model<any>;

    constructor(
        
    ) { }

    async addCms(
        addCmsDTO: AddCmsDTO,
        db_name: string,
    ): Promise<any> {
        
        this.cmsModel = setTanantConnection(
            db_name,
            Cms.name,
            CmsSchema,
        );
        const { page_type } = addCmsDTO;

        const existingPage = await this.cmsModel
            .findOne({ page_name:page_type })
            .exec();
        if (existingPage) {
            return false
        }

        const CmsDetails = new this.cmsModel({
            page_name: addCmsDTO.page_type, page_content:addCmsDTO.page_content,created_by:addCmsDTO.created_by});
        await CmsDetails.save();

        return CmsDetails;
    }
    
    async GetCmsDetails(getCmsDTO: GetCmsDTO, db_name: string) {
        this.cmsModel = setTanantConnection(
            db_name,
            Cms.name,
            CmsSchema,
        );
        const CmsDetails = await this.cmsModel.findOne({ page_name: getCmsDTO.page_type});
        
        return CmsDetails?CmsDetails:false;
    }

    async updateCmsDetails(updateCmsDTO: UpdateCmsDTO, db_name: string,  i18n: I18nContext,) {
        this.cmsModel = setTanantConnection(
            db_name,
            Cms.name,
            CmsSchema,
        );
        const { _id, page_type } = updateCmsDTO;
        const existingCms = await this.cmsModel
            .findOne({ page_type, _id: { $ne: _id } })
            .exec();

        if (existingCms) {
            throw new BadRequestException(i18n.t(`lang.cms.name_exist`));
        }
        const CmsDetails = await this.cmsModel.findOneAndUpdate({ _id }, {page_name:updateCmsDTO.page_type,page_content:updateCmsDTO.page_content});
        return CmsDetails;
    }

    async deleteCmsDetails(
        deleteCmsDTO: DeleteCmsDTO, db_name: string
    ): Promise<any> {
        this.cmsModel = setTanantConnection(
            db_name,
            Cms.name,
            CmsSchema,
        )
        await this.cmsModel.findByIdAndDelete(deleteCmsDTO._id).exec();
        return {
            data: {},
        };
    }


}

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import mongoose, { Model } from 'mongoose';
import { date_moment } from 'src/utils/date.util';
import { Tag, TagSchema } from './schema/tag.schema';
import { CreateTagDTO, TagDTO } from './dto/tag.dto';
import { CustomerTagService } from 'src/customer/service/customer_tag.service';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400 } from 'src/utils/http-code.util';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class TagService {
  public tagModel: Model<any>;

  constructor(private readonly customerTagService: CustomerTagService) {}

  async getTag(id: any, db_name: string): Promise<Tag | Boolean> {
    this.tagModel = setTanantConnection(db_name, Tag.name, TagSchema);
    const tag = await this.tagModel
      .findById({ _id: id, is_active: true })
      .exec();
    return tag ? tag : false;
  }

  async addTag(
    createTagDTO: CreateTagDTO,
    user_id: string,
    db_name: string,
  ): Promise<Tag | any> {
    this.tagModel = setTanantConnection(db_name, Tag.name, TagSchema);
    const existingConfig = await this.tagModel
      .findOne({
        name: { $regex: new RegExp(`^${createTagDTO.name}$`, 'i') },
        delete_date: null,
      })
      .exec();

    if (!existingConfig && !createTagDTO.tag_id) {
      createTagDTO.is_default = false;
      createTagDTO.created_by = user_id;
      createTagDTO.create_date = date_moment();
      createTagDTO.is_active = false;
      const newConfig = new this.tagModel(createTagDTO);
      await newConfig.save();
      return newConfig;
    } else if (existingConfig && !createTagDTO.tag_id) {
      return {
        message: 'Tag already exists with given tag name.',
        data: {},
      };
    } else {
      const tag = await this.tagModel
        .findOne({
          _id: createTagDTO.tag_id,
          name: createTagDTO.name,
          is_active: true,
        })
        .exec();
      if (tag) {
        createTagDTO.updated_by = user_id;
        createTagDTO.update_date = date_moment();
        const updateTag = await this.tagModel.findOneAndUpdate(
          { _id: createTagDTO.tag_id },
          { $set: createTagDTO },
          { new: true },
        );
        return updateTag;
      } else if (!tag && !existingConfig) {
        createTagDTO.updated_by = user_id;
        createTagDTO.update_date = date_moment();
        const updateTag = await this.tagModel.findOneAndUpdate(
          { _id: createTagDTO.tag_id },
          { $set: createTagDTO },
          { new: true },
        );
        return updateTag;
      } else {
        return {
          message: 'Tag already exists with given tag name.',
          data: {},
        };
      }
    }
  }

  async getAllTags(db_name: string): Promise<any> {
    this.tagModel = setTanantConnection(db_name, Tag.name, TagSchema);
    const tagsWithStatus = await this.tagModel
      .aggregate([
        {
          $match: { delete_date: null },
        },
        {
          $lookup: {
            from: 'priceconfiglogs',
            localField: '_id',
            foreignField: 'tag_id',
            as: 'logs',
          },
        },
        {
          $unwind: {
            path: '$logs',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { 'logs.config_update_date': -1 },
        },
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' },
            description: { $first: '$description' },
            created_by: { $first: '$created_by' },
            create_date: { $first: '$create_date' },
            update_date: { $first: '$update_date' },
            updated_by: { $first: '$updated_by' },
            is_active: { $first: '$is_active' },
            is_default: { $first: '$is_default' },
            status: { $first: '$logs.status' },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            created_by: 1,
            create_date: 1,
            update_date: 1,
            updated_by: 1,
            is_active: 1,
            is_default:1,
            status: {
              $ifNull: ['$status', ''],
            },
          },
        },
      ])
      .exec();
    return tagsWithStatus;
  }

  async deleteTag(
    tag: TagDTO,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    try {
      this.tagModel = setTanantConnection(db_name, Tag.name, TagSchema);
      const customerWithTag = await this.customerTagService.getTaggedCustomer(
        tag.tag_id,
        db_name,
        i18n,
      );
      if (!customerWithTag) {
        const updateTag = await this.tagModel.findOneAndUpdate(
          { _id: tag.tag_id },
          {
            $set: {
              delete_date: date_moment(),
              is_active: false,
              update_date: date_moment(),
              updated_by: user_id,
            },
          },
          { new: true },
        );
        return {
          message: i18n.t(`lang.gold_loan.tag_deleted`),
          data: {},
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async getTagByName(name: string, db_name: string): Promise<Tag | Boolean> {
    this.tagModel = setTanantConnection(db_name, Tag.name, TagSchema);
    const tag = await this.tagModel
      .findOne({ name, is_active: true, delete_date: null })
      .exec();
    return tag ? tag : false;
  }

  async updateTagStatus(
    tag_id: string,
    user_id: string,
    is_active: boolean,
    db_name: string,
    i18n: I18nContext,
  ): Promise<Tag> {
    this.tagModel = setTanantConnection(db_name, Tag.name, TagSchema);
    const existingConfig = await this.tagModel.findOne({ _id: tag_id }).exec();

    if (!existingConfig) {
      throw new BadRequestException({
        message: i18n.t(`lang.gold_loan.tag_exists`),
        status: _400,
      });
    } else {
      const updateTag = await this.tagModel.findOneAndUpdate(
        { _id: tag_id },
        {
          $set: { updated_by: user_id, update_date: date_moment(), is_active },
        },
        { new: true },
      );
      return updateTag;
    }
  }
}

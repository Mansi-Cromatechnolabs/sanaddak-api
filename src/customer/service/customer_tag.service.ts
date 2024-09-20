import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { CustomerTag, CustomerTagSchema } from '../schema/customer_tag.schema';
import { REQUEST } from '@nestjs/core';
import { date_moment } from 'src/utils/date.util';
import {
  CreateCustomertagDTO,
  CustomerTagDTO,
  DeleteCustomerTagDTO,
} from '../dto/customer_tag.dto';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400 } from 'src/utils/http-code.util';
import { I18nContext } from 'nestjs-i18n';
import { TagService } from 'src/app/gold_loan/tag.service';

@Injectable()
export class CustomerTagService {
  public customerTagModel: Model<any>;

  constructor(
    @Inject(forwardRef(() => TagService))
    private readonly tagService: TagService,
  ) {}

  async addCustomerTag(
    createCustomerTagDTOs: CreateCustomertagDTO[],
    db_name: string,
    i18n: I18nContext,
  ): Promise<CustomerTag[]> {
    this.customerTagModel = setTanantConnection(
      db_name,
      CustomerTag.name,
      CustomerTagSchema,
    );
    const processTag = async (
      createCustomertagDTO: CreateCustomertagDTO,
    ): Promise<CustomerTag> => {
      const existingTag = await this.customerTagModel
        .findOne({
          tag_id: createCustomertagDTO.tag_id,
          customer_id: createCustomertagDTO.customer_id,
          delete_date: null,
        })
        .exec();

      if (existingTag) {
        if (!createCustomertagDTO.customer_tag_id) {
          throw new BadRequestException(i18n.t(`lang.customer_tag.exists`));
        } else {
          if (!createCustomertagDTO.tag_id) {
            const newTag = await this.customerTag(
              createCustomertagDTO,
              db_name,
            );
            return newTag;
          }
          createCustomertagDTO.update_date = date_moment();
          return await this.customerTagModel.findOneAndUpdate(
            { _id: createCustomertagDTO.customer_tag_id },
            { $set: createCustomertagDTO },
            { new: true },
          );
        }
      } else {
        const newTag = await this.customerTag(createCustomertagDTO, db_name);
        return newTag;
      }
    };

    return Promise.all(createCustomerTagDTOs.map(processTag));
  }

  async customerTag(
    createCustomertagDTO: CreateCustomertagDTO,
    db_name: string,
  ): Promise<CustomerTag> {
    this.customerTagModel = setTanantConnection(
      db_name,
      CustomerTag.name,
      CustomerTagSchema,
    );
    createCustomertagDTO.create_date = date_moment();
    const newTag = new this.customerTagModel(createCustomertagDTO);
    await newTag.save();
    return newTag;
  }

  async getCustomerTags(
    customertagDTO: CustomerTagDTO,
    db_name: string,
  ): Promise<CustomerTag[]> {
    this.customerTagModel = setTanantConnection(
      db_name,
      CustomerTag.name,
      CustomerTagSchema,
    );
    const customerTags = await this.customerTagModel
      .aggregate([
        {
          $match: {
            customer_id: new mongoose.Types.ObjectId(
              customertagDTO.customer_id,
            ),
            delete_date: null,
          },
        },
        {
          $lookup: {
            from: 'tags',
            localField: 'tag_id',
            foreignField: '_id',
            as: 'tag_details',
          },
        },
        {
          $unwind: '$tag_details',
        },
        {
          $match: {
            $expr: {
              $and: [{ $eq: ['$tag_details.is_active', true] }],
            },
          },
        },
        {
          $project: {
            customer_tag_id: '$_id',
            tag_id: 1,
            tag: '$tag_details.name',
            is_default: '$tag_details.is_default',
            priority: 1,
            customer_id: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            priority: 1,
          },
        },
      ])
      .exec();

    return customerTags;
  }

  async deleteCustomerTag(
    deleteCustomerTagDTO: DeleteCustomerTagDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<CustomerTag> {
    this.customerTagModel = setTanantConnection(
      db_name,
      CustomerTag.name,
      CustomerTagSchema,
    );
    try {
      const customer_tag = await this.customerTagModel.findOne({
        tag_id: new mongoose.Types.ObjectId(deleteCustomerTagDTO.tag_id),
        customer_id: new mongoose.Types.ObjectId(
          deleteCustomerTagDTO.customer__id,
        ),
      });
      const tag = await this.tagService.getTag(customer_tag.tag_id, db_name);

      if (!tag) {
        throw new BadRequestException(i18n.t(`lang.gold_loan.tag_not_found`));
      }
      if (tag?.['name'] == 'Egypt') {
        throw new BadRequestException(i18n.t(`lang.customer_tag.default_tag`));
      }

      const updatedbranchDayAvailability =
        await this.customerTagModel.findOneAndUpdate(
          {
            tag_id: deleteCustomerTagDTO.tag_id,
            customer_id: deleteCustomerTagDTO.customer__id,
            delete_date: null,
          },
          {
            $set: {
              delete_date: date_moment(),
            },
          },
          { new: true },
        );
      return updatedbranchDayAvailability;
    } catch (error) {
      throw error;
    }
  }

  async getTaggedCustomer(
    tag_id: string,
    db_name,
    i18n: I18nContext,
  ): Promise<CustomerTag> {
    this.customerTagModel = setTanantConnection(
      db_name,
      CustomerTag.name,
      CustomerTagSchema,
    );
    const customerWithTag = await this.customerTagModel.findOne({ tag_id });
    if (customerWithTag) {
      throw new BadRequestException(
        i18n.t(`lang.customer_tag.customer_exists`),
      );
    }
    return customerWithTag;
  }

  async getTagByCustomerId(
    customer_id: string,
    db_name,
  ): Promise<string | any> {
    this.customerTagModel = setTanantConnection(
      db_name,
      CustomerTag.name,
      CustomerTagSchema,
    );
    const tagWithCustomer = await this.customerTagModel.findOne({
      customer_id: customer_id,
      priority: 1,
    });
    if (!tagWithCustomer) {
      return false;
    }
    return tagWithCustomer.tag_id;
  }
}
      
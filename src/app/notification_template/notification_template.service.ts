import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Model } from 'mongoose';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400, _404 } from 'src/utils/http-code.util';
import {
  NotificationTemplate,
  NotificationTemplateSchema,
} from './schema/notification_template.schema';
import {
  AddNotificationTemplateDTO,
  GetNotificationTemplateDto,
  UpdateNotificationTemplateDTO,
} from './dto/notification_template.dto';
import { date_moment } from 'src/utils/date.util';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';

@Injectable()
export class NotificationTemplateService {
  public notificationTemplateModel: Model<any>;

  constructor() {}

  async addNotificationTemplate(
    addNotificationTemplateDTO: AddNotificationTemplateDTO,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.notificationTemplateModel = setTanantConnection(
      db_name,
      NotificationTemplate.name,
      NotificationTemplateSchema,
    );

    const existingName = await this.notificationTemplateModel
      .findOne({ key: addNotificationTemplateDTO.key })
      .exec();

    if (existingName) {
      throw new BadRequestException(i18n.t(`lang.notification_template.key_exist`));
    }
    addNotificationTemplateDTO.created_by = user_id;
    addNotificationTemplateDTO.created_date = date_moment();
    const res = new this.notificationTemplateModel(addNotificationTemplateDTO);
    await res.save();

    return res;
  }
  async updateNotificationTemplate(
    updateNotificationTemplateDTO: UpdateNotificationTemplateDTO,
    user_id: string,
    db_name: string,
  ): Promise<any> {
    this.notificationTemplateModel = setTanantConnection(
      db_name,
      NotificationTemplate.name,
      NotificationTemplateSchema,
    );
    const { notification_template_id } = updateNotificationTemplateDTO;

    const res = await this.notificationTemplateModel.findOneAndUpdate(
      { _id: notification_template_id },
      {
        name: updateNotificationTemplateDTO.name,
        message: updateNotificationTemplateDTO.message,
        notification_type: updateNotificationTemplateDTO.notification_type,
        updated_by: user_id,
      },
      { new: true },
    );

    return res;
  }
  async getNotificationsTemplate(
    user_id: string,
    db_name: string,
    getNotificationTemplateDto: GetNotificationTemplateDto,
    i18n: I18nContext,
  ) {
    this.notificationTemplateModel = setTanantConnection(
      db_name,
      NotificationTemplate.name,
      NotificationTemplateSchema,
    );

    if (
      getNotificationTemplateDto.notification_type &&
      getNotificationTemplateDto.notification_template_id
    ) {
      const notificationTemplate = await this.notificationTemplateModel
        .findOne({
          notification_type: getNotificationTemplateDto.notification_type,
          _id: getNotificationTemplateDto.notification_template_id,
        })
        .exec();

      if (!notificationTemplate) {
        throw new NotFoundException(i18n.t(`lang.notification_template.not_found`));
      }

      return notificationTemplate;
    }
    else if (getNotificationTemplateDto.notification_type) {
      const notificationTemplates = await this.notificationTemplateModel
        .find({
          notification_type: getNotificationTemplateDto.notification_type,
        })
        .exec();

      if (notificationTemplates.length === 0) {
        throw new NotFoundException(i18n.t(`lang.notification_template.no_type_found`));
      }

      return notificationTemplates;
    }
  }

  async getNotificationDetails(key: string, type: string, db_name: string): Promise<any> {
    this.notificationTemplateModel = setTanantConnection(
      db_name,
      NotificationTemplate.name,
      NotificationTemplateSchema,
    );
    const notification = await this.notificationTemplateModel.findOne({ key: key, notification_type: type }).exec();

    return notification ? notification : false;
  }
}

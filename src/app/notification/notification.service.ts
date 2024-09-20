import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Model } from 'mongoose';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400 } from 'src/utils/http-code.util';
import { replacePlaceholders } from 'src/utils/helper';
import {
  CustomerNotification,
  CustomerNotificationSchema,
} from './schema/customer_notification.schema';
import {
  CustomerNotificationDTO,
  GetCustomerNotificationDTO,
} from './dto/notification.dto';
import { date_moment } from 'src/utils/date.util';
import { sendPushNotification } from 'src/utils/push_notification.util';
import { CustomerService } from 'src/customer/service/customer.service';
import { NotificationTemplateService } from '../notification_template/notification_template.service';

@Injectable()
export class CustomerNotificationService {
  public customerNotificationModel: Model<any>;

  constructor(
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => NotificationTemplateService))
    private readonly notificationTemplateService: NotificationTemplateService,
  ) {}

  async getCustomerNotification(
    getCustomerNotificationDTO: GetCustomerNotificationDTO,
    user_id: string,
    db_name: string,
  ) {
    this.customerNotificationModel = setTanantConnection(
      db_name,
      CustomerNotification.name,
      CustomerNotificationSchema,
    );

    if (getCustomerNotificationDTO.notification_id) {
      const customerNotificationDetails = await this.customerNotificationModel
        .findOne({
          customer_id: user_id,
          _id: getCustomerNotificationDTO.notification_id,
        })
        .exec();
      return customerNotificationDetails;
    } else {
      const customerNotificationDetails = await this.customerNotificationModel
        .find({ customer_id: user_id })
        .exec();
      return customerNotificationDetails;
    }
  }

  async findCustomerUnreadNotification(
    user_id: string,
    db_name: string,
  ): Promise<Boolean> {
    this.customerNotificationModel = setTanantConnection(
      db_name,
      CustomerNotification.name,
      CustomerNotificationSchema,
    );
    const customerNotificationDetail = await this.customerNotificationModel
      .findOne({ customer_id: user_id, is_read: false })
      .exec();
    if (customerNotificationDetail) {
      return false;
    }
    return true;
  }

  async addNotification(
    customerNotificationDTO: CustomerNotificationDTO,
    user_id: string,
    db_name: string,
  ) {
    this.customerNotificationModel = setTanantConnection(
      db_name,
      CustomerNotification.name,
      CustomerNotificationSchema,
    );

    customerNotificationDTO.created_date = date_moment();
    const NotificationDetails = new this.customerNotificationModel({
      customer_id: user_id,
      message: customerNotificationDTO.message,
      notification_type: customerNotificationDTO.notification_type,
      created_date: date_moment(),
    });
    await NotificationDetails.save();

    return NotificationDetails;
  }

  async readNotification(
    getCustomerNotificationDTO: GetCustomerNotificationDTO,
    user_id: string,
    db_name: string,
  ) {
    this.customerNotificationModel = setTanantConnection(
      db_name,
      CustomerNotification.name,
      CustomerNotificationSchema,
    );

    if (getCustomerNotificationDTO.notification_id) {
      await this.customerNotificationModel
        .findOneAndUpdate(
          {
            customer_id: user_id,
            _id: getCustomerNotificationDTO.notification_id,
            is_read: { $ne: true },
          },
          { $set: { is_read: true } },
          { new: true },
        )
        .exec();

      return {};
    } else {
      await this.customerNotificationModel
        .updateMany(
          { customer_id: user_id, is_read: false },
          { $set: { is_read: true } },
        )
        .exec();

      return {};
    }
  }

  async sendPushNotification(
    user_id: string,
    key: string,
    type: string,
    notification_type: number,
    db_name: string,
    placeholders: Record<string, string> = {},
    data?: any,
  ): Promise<boolean> {
    if (!user_id || !key || !type || !db_name) {
      return true;
    }
    const user_details = await this.customerService.getUserProfile(
      user_id,
      db_name,
    );

    const notificationData =
      await this.notificationTemplateService.getNotificationDetails(
        key,
        type,
        db_name,
      );

    if (!notificationData || !user_details.fcm_token) {
      return true;
    }

    const messageWithPlaceholders =
      replacePlaceholders(notificationData.message, placeholders) ||
      notificationData.message;

    await this.addNotification(
      {
        notification_type,
        message: messageWithPlaceholders,
        created_date: date_moment(),
      },
      user_id,
      db_name,
    );
    // Send the push notification using fcm
    if (user_details.is_notification_enable === true) {
      await sendPushNotification(
        user_details.fcm_token,
        notificationData.name,
        messageWithPlaceholders,
        data,
      );
    }

    return false;
  }
}

import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import mongoose, { Model } from 'mongoose';
import {
  GetStaffNotificationDTO,
  StaffNotificationDTO,
} from './dto/staff_notifications.dto';
import { date_moment } from 'src/utils/date.util';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import {
  StaffNotification,
  StaffNotificationSchema,
} from './schema/staff_notifications.schema';
import { NotificationTemplateService } from '../notification_template/notification_template.service';
import { sendPushNotification } from 'src/utils/push_notification.util';
import { AuthService } from '../auth/auth.service';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';
import { replacePlaceholders } from 'src/utils/helper';

@Injectable()
export class StaffNotificationsService {
  public staffNotificationModel: Model<any>;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => NotificationTemplateService))
    private readonly notificationTemplateService: NotificationTemplateService,
  ) {}

  async addStaffNotification(
    staffNotificationDTO: StaffNotificationDTO,
    user_id: string,
    db_name: string,
  ): Promise<any> {
    this.staffNotificationModel = setTanantConnection(
      db_name,
      StaffNotification.name,
      StaffNotificationSchema,
    );

    staffNotificationDTO.created_by = user_id;
    staffNotificationDTO.created_date = date_moment();
    const staffNotificationDetails = new this.staffNotificationModel(
      staffNotificationDTO,
    );
    try{
      await staffNotificationDetails.save();
    }catch(error){
      throw new BadRequestException(error.message)
    }
    return staffNotificationDetails;
  }

  async getStaffNotification(
    store_id: string,
    staff_id: string,
    db_name: string,
  ) {
    this.staffNotificationModel = setTanantConnection(
      db_name,
      StaffNotification.name,
      StaffNotificationSchema,
    );

    const notifications = await this.staffNotificationModel
      .aggregate([
        {
          $match: {
            store_id: new mongoose.Types.ObjectId(store_id),
            $or: [
              { staff_id: new mongoose.Types.ObjectId(staff_id) },
              { staff_id: null },
            ],
          },
        },
        {
          $addFields: {
            creator: { $toObjectId: '$created_by' },
          },
        },
        {
          $lookup: {
            from: 'customer',
            localField: 'creator',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $lookup: {
            from: 'Staff',
            localField: 'creator',
            foreignField: '_id',
            as: 'staff',
          },
        },
        {
          $addFields: {
            creator_details: {
              $cond: {
                if: { $gt: [{ $size: '$customer' }, 0] },
                then: {
                  _id: { $arrayElemAt: ['$customer._id', 0] },
                  full_name: {
                    $concat: [
                      { $arrayElemAt: ['$customer.first_name', 0] },
                      ' ',
                      { $arrayElemAt: ['$customer.last_name', 0] },
                    ],
                  },
                  email: {
                    $ifNull: [{ $arrayElemAt: ['$customer.email', 0] }, ''],
                  },
                  phone: {
                    $concat: [
                      { $arrayElemAt: ['$customer.country_code', 0] },
                      ' ',
                      { $arrayElemAt: ['$customer.phone', 0] },
                    ],
                  },
                  profile_image: {
                    $ifNull: [
                      { $arrayElemAt: ['$customer.profile_image', 0] },
                      '',
                    ],
                  },
                },
                else: {
                  _id: { $arrayElemAt: ['$staff._id', 0] },
                  full_name: {
                    $concat: [
                      { $arrayElemAt: ['$staff.first_name', 0] },
                      ' ',
                      { $arrayElemAt: ['$staff.last_name', 0] },
                    ],
                  },
                  email: {
                    $ifNull: [{ $arrayElemAt: ['$staff.email', 0] }, ''],
                  },
                  phone: {
                    $concat: [
                      { $arrayElemAt: ['$staff.country_code', 0] },
                      ' ',
                      { $arrayElemAt: ['$staff.mobile_number', 0] },
                    ],
                  },
                  profile_image: {
                    $ifNull: [
                      { $arrayElemAt: ['$staff.profile_image', 0] },
                      '',
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            store_id: 1,
            staff_id: 1,
            is_read: 1,
            message: 1,
            notification_type: 1,
            created_by: 1,
            created_date: 1,
            updated_by: 1,
            updated_date: 1,
            creator_details: 1,
          },
        },
      ])
      .catch((err) => {
        throw err;
      });

    return notifications;
  }

  async readNotification(
    getStaffNotificationDTO: GetStaffNotificationDTO,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.staffNotificationModel = setTanantConnection(
      db_name,
      StaffNotification.name,
      StaffNotificationSchema,
    );

    const query = getStaffNotificationDTO.notification_id
      ? { _id: getStaffNotificationDTO.notification_id }
      : {};

    const notifications = await this.staffNotificationModel.updateMany(query, {
      $set: { is_read: true, updated_by: user_id, updated_date: date_moment() },
    });

    if (notifications.matchedCount === 0) {
      throw new NotFoundException(i18n.t(`lang.staff_notification.not_found`));
    }

    const updatedNotifications = await this.staffNotificationModel.find(query);
    return updatedNotifications;
  }

  async sendPushNotification(
    customer_id: string,
    key: string,
    type: string,
    notification_type: number,
    db_name: string,
    staff_id?: string,
    store_id?: string,
    placeholders: Record<string, string> = {},
    data?: any,
  ): Promise<boolean> {
    if (!customer_id || !key || !type || !db_name) {
      return true;
    }

    const user_details = staff_id
      ? await this.authService.getUserProfile(staff_id, db_name)
      : null;

    const notificationData =
      await this.notificationTemplateService.getNotificationDetails(
        key,
        type,
        db_name,
      );

    if (!notificationData || !user_details?.fcm_token) {
      return true;
    }

    const messageWithPlaceholders =
      replacePlaceholders(notificationData.message, placeholders) ||
      notificationData.message;
    
    await this.addStaffNotification(
      {
        store_id: user_details?.store_id || store_id,
        staff_id: staff_id,
        notification_type: notification_type,
        message: messageWithPlaceholders,
        created_date: date_moment(),
        created_by: customer_id,
      },
      customer_id,
      db_name,
    );
    
    // Send push notification
    await sendPushNotification(
      user_details.fcm_token,
      notificationData.name,
      messageWithPlaceholders,
      data,
    );

    return false;
  }
}

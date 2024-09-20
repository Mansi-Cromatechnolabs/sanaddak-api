import { BadRequestException, Injectable } from '@nestjs/common';
import { date_moment } from 'src/utils/date.util';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import {
  NotificationTemplate,
  NotificationTemplateSchema,
} from '../notification_template/schema/notification_template.schema';
import { AddNotificationTemplateDTO } from '../notification_template/dto/notification_template.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class NotificationTemplateSeeder {
  notificationTemplateModel: any;
  constructor(private readonly userService: UserService) {}

  async addNotificationTemplate(
    addNotificationTemplateDTO: AddNotificationTemplateDTO,
    db_name: string,
  ): Promise<any> {
    this.notificationTemplateModel = setTanantConnection(
      db_name,
      NotificationTemplate.name,
      NotificationTemplateSchema,
    );

    const existingTemplate = await this.notificationTemplateModel
      .findOne({ key: addNotificationTemplateDTO.key })
      .exec();

    if (existingTemplate) {
      return false;
    }
    const res = new this.notificationTemplateModel(addNotificationTemplateDTO);
    await res.save();

    return res;
  }

  async seed(db_name: string) {
    let user = await this.userService.findTanantUserByEmail(
      db_name,
      process.env.DEFAULT_STAFF_EMAIL_4_SEEDER,
    );
    if (!user) {
      throw new BadRequestException('User not Found');
    }

    const notificationTemplates = [
      {
        key: 'book_appointment',
        name: 'Appointment Confirmed!',
        message:
          'Your appointment has been successfully booked. Thank you for choosing Sanaddak. We look forward to seeing you!',
        notification_type: 'notification',
      },
      {
        key: 'user_check_valuation',
        name: 'Welcome to Sanaddak!',
        message:
          'Sign in to view your gold valuation. Get started now for a seamless experience!',
        notification_type: 'notification',
      },
      {
        key: 'generate_agreement',
        name: 'Contract Ready for Review',
        message:
          'Your contract is ready! Please review and approve it to proceed. Check it out now!',
        notification_type: 'notification',
      },
      {
        key: 'customer_side_book_appointment',
        name: 'New Appointment booked',
        message:
          'New Appointment booked appointment ID :{{id}} on {{date}} at {{time}} by {{customer_name}} for {{appointment_type}}',
        notification_type: 'notification',
      },
      {
        key: 'extend_process',
        name: 'Extend Process Initiated',
        message:
          "Your current liquidity has been completed, and you've initiated the Extend process. Please complete the steps to extend your gold asset management.",
        notification_type: 'notification',
      },
      {
        key: 'staff_side_reset_password',
        name: 'Password Successfully Reset',
        message:
          "Your password has been reset. If this wasn't you, please contact support immediately.",
        notification_type: 'notification',
      },
      {
        key: 'staff_side_update_phone',
        name: 'Phone number updated',
        message:
          "Your phone number has been successfully updated in your profile. If this wasn't you, please contact support immediately.",
        notification_type: 'notification',
      },
      {
        key: 'staff_side_update_email',
        name: 'Email updated',
        message:
          "Your email has been successfully updated in your profile. If this wasn't you, please contact support immediately.",
        notification_type: 'notification',
      },
      {
        key: 'staff_side_update_email_phone',
        name: 'Email & Phone number updated',
        message:
          "Your email and phone number has been successfully updated in your profile. If this wasn't you, please contact support immediately.",
        notification_type: 'notification',
      },
      {
        key: 'liquidity_disbursed',
        name: 'Liquidity disbursed',
        message:
          "Liquidity amount with ID {{liquidity_id}} has been successfully disbursed to {{customer_name}}'s account. Please ensure the customer is informed.",
        notification_type: 'notification',
      },
      {
        key: 'user_visit_at_store',
        name: 'Welcome to Sanaddak',
        message:
          'Welcome to {{store_name}}! Please complete your KYC verification before proceeding with any transactions. Thank you!.',
        notification_type: 'notification',
      },
      {
        key: 'gold_pieces_valuation',
        name: 'Gold Valuation Processing',
        message:
          'Your gold pieces are currently under inspection by our expert staff. We working on the valuation process. Stay tuned for updates!',
        notification_type: 'notification',
      },
      {
        key: 'gold_pieces_and_send_contract',
        name: 'Your Gold Valuation is Complete!',
        message:
          'Our inspector has reviewed and documented your gold pieces. The agreement is being created and will be sent to you shortly. Thank you for choosing Sanaddak!',
        notification_type: 'notification',
      },
      {
        key: 'uploaded_signed_contract',
        name: 'Agreement Process Completed!',
        message:
          'Your signed agreement has been successfully uploaded. Thank you for your cooperation!',
        notification_type: 'notification',
      },
      {
        key: 'loan_amount_transfer_to_customer_account',
        name: 'Payment Successful!',
        message:
          'Your loan amount has been successfully transferred to your account. Thank you for choosing Sanaddak!',
        notification_type: 'notification',
      },
      {
        key: 'staff_agreement_approved_by_customer',
        name: 'Liquidity Agreement Successfully Approved',
        message:
          'The liquidity agreement has been successfully approved by {{customer_name}} for Liquidity {{liquidity_number}}.',
        notification_type: 'notification',
      },
      {
        key: 'customer_agreement_approved_by_customer',
        name: 'Liquidity Agreement Successfully Approved',
        message:
          'Congratulations! The liquidity agreement has been successfully approved by you. Thank you for your trust and partnership!',
        notification_type: 'notification',
      },
      {
        key: 'agreement_rejected_by_customer',
        name: 'Liquidity Agreement Disapproved',
        message:
          'Unfortunately, the liquidity agreement was not approved by you. Please contact us for further assistance or to discuss the next steps.',
        notification_type: 'notification',
      },

      {
        key: 'appointment_reminder_before_two_days',
        name: 'Appointment Reminder: Just 2 Days Left!',
        message:
          "Your appointment {{booking_number}} is just 2 days away! Don't forget to visit our store.",
        notification_type: 'notification',
      },
      {
        key: 'appointment_reminder_same_day_morning',
        name: 'Appointment Reminder',
        message:
          "Just a reminder! Your appointment {{booking_number}} is scheduled for today. Don't forget to visit our store. See you soon!",
        notification_type: 'notification',
      },
      {
        key: 'appointment_reminder_before_two_hours',
        name: 'Appointment Reminder',
        message:
          "Just a reminder: Your appointment {{booking_number}} is today in a few hours. Don't forget to visit the store!",
        notification_type: 'notification',
      },
      {
        key: 'liquidity_approved',
        name: 'Congratulations! Your Liquidity is Approved',
        message:
          'Good news! Your liquidity application request has been approved. Thank you for choosing Sanaddak!',
        notification_type: 'notification',
      },
      {
        key: 'installment_payment_success',
        name: 'Payment Successful!',
        message:
          'Your installment has been successfully paid. Thank you for your payment! You can view your updated payment details in the app.',
        notification_type: 'notification',
      },
      {
        key: 'installment_reminder_before_three_days',
        name: 'Installment Reminder',
        message:
          'Your installment is due in 3 days. Please make sure to complete the payment to avoid any late fees.',
        notification_type: 'notification',
      },
      {
        key: 'installment_reminder_before_one_day',
        name: 'Installment Due Reminder',
        message:
          'Reminder: Your installment is due in 1 day. Please make the payment to avoid any late fees. Thank you!',
        notification_type: 'notification',
      },
      {
        key: 'due_installment_reminder_same_day',
        name: 'Installment Due Reminder',
        message:
          'Your installment is due today! You have until midnight to pay and avoid any penalties. Act now to stay on track!',
        notification_type: 'notification',
      },
      {
        key: 'installment_missed',
        name: 'Missed Payment Notice',
        message:
          'You’ve missed your installment payment. A penalty fee has been applied. Please make the payment at your earliest convenience to avoid further charges.',
        notification_type: 'notification',
      },
      {
        key: 'liquidity_maturity_after_two_days',
        name: 'Liquidity Maturity Reminder',
        message:
          'Reminder: Your current liquidity will mature in 2 days. Take action now to Buyback, Extend or Liquidate your options.',
        notification_type: 'notification',
      },
      {
        key: 'liquidity_maturity_today',
        name: 'Liquidity Maturity Reminder',
        message:
          'Your current liquidity term completes today. Please review your options for Buyback, Extend or Liquidate. Act now to make the best decision!',
        notification_type: 'notification',
      },
      {
        key: 'buyback_process_initiated',
        name: 'Buyback Process in Progress',
        message:
          'Your current liquidity period has ended, and the Buyback process has been initiated. Please complete the required steps to finalize the process.',
        notification_type: 'notification',
      },
      {
        key: 'liquidation_process_initiated',
        name: 'Liquidation Process Started',
        message:
          'You have successfully initiated the liquidation process for your gold assets. Please complete the necessary steps to finalize your transaction.',
        notification_type: 'notification',
      },
      {
        key: 'liquidity_closure_alert',
        name: 'Liquidity Closure Alert',
        message:
          'Your current liquidity is in the process of closure. Please review the details and take any necessary actions.',
        notification_type: 'notification',
      },
      {
        key: 'kyc_document_upload',
        name: 'Document uploaded Successfully',
        message:
          'Your KYC document has been successfully uploaded. Please visit our store to verify it at your convenience.',
        notification_type: 'notification',
      },
    ];

    for (const ntemplate of notificationTemplates) {
      await this.addNotificationTemplate(
        {
          key: ntemplate.key,
          name: ntemplate.name,
          message: ntemplate.message,
          notification_type: ntemplate.notification_type,
          created_by: user.id,
          created_date: date_moment(),
        } as AddNotificationTemplateDTO,
        db_name,
      );
    }
  }
}

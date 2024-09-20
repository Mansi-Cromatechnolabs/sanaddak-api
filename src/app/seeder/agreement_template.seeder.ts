import { BadRequestException, Injectable } from '@nestjs/common';
import { date_moment } from 'src/utils/date.util';
import { AddAgreementTemplateDTO } from '../agreement_template/dto/agreement_template.dto';
import {
  AgreementTemplate,
  AgreementTemplateSchema,
} from '../agreement_template/schema/agreement_template.schema';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { UserService } from '../user/user.service';

@Injectable()
export class AgreementTemplateSeeder {
  agreementTemplateModel: any;
  constructor(private readonly userService: UserService) {}

  async addAgreementTemplate(
    addAgreementTemplateDTO: AddAgreementTemplateDTO,
    user_id: string,
    db_name: string,
  ): Promise<any> {
    this.agreementTemplateModel = setTanantConnection(
      db_name,
      AgreementTemplate.name,
      AgreementTemplateSchema,
    );

    const existingName = await this.agreementTemplateModel
      .find({ name: addAgreementTemplateDTO.name })
      .exec();
    if (existingName.length != 0) {
      return false;
    }
    addAgreementTemplateDTO.created_by = user_id;
    addAgreementTemplateDTO.created_date = date_moment();
    const res = new this.agreementTemplateModel(addAgreementTemplateDTO);
    await res.save();

    return res;
  }

  async seed(db_name: string) { 
    const user = await this.userService.findTanantUserByEmail(
      db_name,
      process.env.DEFAULT_STAFF_EMAIL_4_SEEDER,
    );

    if (!user) {
      throw new BadRequestException('User not Found');
    }

    const agreementTemplateData = [
      {
        name: 'Liquidate Agreement',
        priority: 1,
        body: '<h3>This is Liquidate Agreement.</h3><p>This is for {{customer_name}}.</p>',
        agreement_type: 3,
      },
      {
        name: 'Fullfillment Agreement',
        priority: 1,
        body: '<h3>This is Fullfillment Agreement.</h3><p>This is for {{customer_name}}.</p>',
        agreement_type: 2,
      },
      {
        name: 'Sale Agreement',
        priority: 1,
        body: "<h3 style='color: #333; font-family: Arial, sans-serif; margin: 20px 0;'>Sale Agreement</h3><p style='font-family: Arial, sans-serif; line-height: 1.6; margin: 10px 0;'>This agreement pertains to the liquidity term of the loan associated with the following details:</p><p style='font-family: Arial, sans-serif; line-height: 1.6; margin: 10px 0;'><span style='font-weight: bold; color: #0056b3;'>Liquidate Number:</span> {{liquidate_number}}</p><p style='font-family: Arial, sans-serif; line-height: 1.6; margin: 10px 0;'><span style='font-weight: bold; color: #0056b3;'>Customer Name:</span> {{customer_name}}</p><p style='font-family: Arial, sans-serif; line-height: 1.6; margin: 10px 0;'>By accepting this agreement, you acknowledge and agree to the terms and conditions stated herein.</p>",
        agreement_type: 1,
      },
      {
        name: 'Transfer Agreement',
        priority: 3,
        body: "<h3 style='color: #333; font-family: Arial, sans-serif; margin: 20px 0;'>Transfer Agreement</h3><p style='font-family: Arial, sans-serif; line-height: 1.6; margin: 10px 0;'>This agreement pertains to the liquidity term of the loan associated with the following details:</p><p style='font-family: Arial, sans-serif; line-height: 1.6; margin: 10px 0;'><span style='font-weight: bold; color: #0056b3;'>Liquidate Number:</span> {{liquidate_number}}</p><p style='font-family: Arial, sans-serif; line-height: 1.6; margin: 10px 0;'><span style='font-weight: bold; color: #0056b3;'>Customer Name:</span> {{customer_name}}</p><p style='font-family: Arial, sans-serif; line-height: 1.6; margin: 10px 0;'>By accepting this agreement, you acknowledge and agree to the terms and conditions stated herein.</p>",
        agreement_type: 1,
      },
      {
        name: 'Liquidity Term of Agreement',
        priority: 2,
        body: "<h3 style='color: #333; font-family: Arial, sans-serif; margin: 20px 0;'>Liquidity Term of Agreement</h3><p style='font-family: Arial, sans-serif; line-height: 1.6; margin: 10px 0;'>This agreement pertains to the liquidity term of the loan associated with the following details:</p><p style='font-family: Arial, sans-serif; line-height: 1.6; margin: 10px 0;'><span style='font-weight: bold; color: #0056b3;'>Liquidate Number:</span> {{liquidate_number}}</p><p style='font-family: Arial, sans-serif; line-height: 1.6; margin: 10px 0;'><span style='font-weight: bold; color: #0056b3;'>Customer Name:</span> {{customer_name}}</p><p style='font-family: Arial, sans-serif; line-height: 1.6; margin: 10px 0;'>By accepting this agreement, you acknowledge and agree to the terms and conditions stated herein.</p>",
        agreement_type: 1,
      },
    ];

    for (const template of agreementTemplateData) {
      await this.addAgreementTemplate(
        {
          name: template.name,
          priority: template.priority,
          body: template.body,
          agreement_type: template.agreement_type,
        } as AddAgreementTemplateDTO,
        user?.id,
        db_name,
      );
    }
  }
}

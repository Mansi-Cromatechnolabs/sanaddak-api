import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Model } from 'mongoose';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400 } from 'src/utils/http-code.util';
import {
  AgreementTemplate,
  AgreementTemplateSchema,
} from './schema/agreement_template.schema';
import {
  AddAgreementTemplateDTO,
  GetAgreementTemplateDto,
  UpdateAgreementTemplateDTO,
} from './dto/agreement_template.dto';
import { CustomerService } from 'src/customer/service/customer.service';
import { date_moment } from 'src/utils/date.util';
import { LoanService } from '../loan/service/loan.service';
import { generatePdf } from 'src/utils/file.util';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class AgreementTemplateService {
  public agreementTemplateModel: Model<any>;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => LoanService))
    private readonly loanService: LoanService,
  ) {}

  async addAgreementTemplate(
    addAgreementTemplateDTO: AddAgreementTemplateDTO,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.agreementTemplateModel = setTanantConnection(
      db_name,
      AgreementTemplate.name,
      AgreementTemplateSchema,
    );

    const existingName = await this.agreementTemplateModel
      .findOne({ name: addAgreementTemplateDTO.name })
      .exec();

    if (existingName) {
      throw new BadRequestException(i18n.t(`lang.agreement.name_exist`));
    }
    addAgreementTemplateDTO.created_by = user_id;
    addAgreementTemplateDTO.created_date = date_moment();
    const res = new this.agreementTemplateModel(addAgreementTemplateDTO);
    await res.save();

    return res;
  }
  async updateAgreementTemplate(
    updateAgreementTemplateDTO: UpdateAgreementTemplateDTO,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.agreementTemplateModel = setTanantConnection(
      db_name,
      AgreementTemplate.name,
      AgreementTemplateSchema,
    );
    const { agreement_template_id, name } = updateAgreementTemplateDTO;

    const existingTemplate = await this.agreementTemplateModel
      .findOne({ name: name, _id: { $ne: agreement_template_id } })
      .exec();

    if (existingTemplate) {
      throw new BadRequestException(i18n.t(`lang.agreement.name_exist`));
    }

    const res = await this.agreementTemplateModel.findOneAndUpdate(
      { _id: agreement_template_id },
      {
        name: name,
        priority: updateAgreementTemplateDTO.priority,
        body: updateAgreementTemplateDTO.body,
        updated_by: user_id,
        agreement_type: updateAgreementTemplateDTO.agreement_type,
      },
      { new: true },
    );

    return res;
  }
  async getAgreementTemplate(
    getAgreementTemplateDto: GetAgreementTemplateDto,
    type: string,
    db_name: string,
    i18n: I18nContext,
  ) {
    this.agreementTemplateModel = setTanantConnection(
      db_name,
      AgreementTemplate.name,
      AgreementTemplateSchema,
    );

    const agreementTemplateDetails = await this.getLoanAgreementTemplates(
      getAgreementTemplateDto,
      db_name,
      i18n,
    );

    const loan = await this.loanService.findLoan(
      getAgreementTemplateDto.loan_id,
      db_name,
    );
    const customer = await this.customerService.getUserProfile(
      loan.customer_id.toString(),
      db_name,
    );

    const agreement_url = await generatePdf(
      agreementTemplateDetails,
      type,
      customer?.id,
      loan.liquidate_number,
    );

    return { agreements_details: agreementTemplateDetails, agreement_url };
  }

  async getLoanAgreementTemplates(
    getAgreementTemplateDto: GetAgreementTemplateDto,
    db_name: string,
    i18n: I18nContext,
  ) {
    this.agreementTemplateModel = setTanantConnection(
      db_name,
      AgreementTemplate.name,
      AgreementTemplateSchema,
    );

    const loan = await this.loanService.findLoan(
      getAgreementTemplateDto.loan_id,
      db_name,
    );

    if (
      getAgreementTemplateDto.agreement_type == 1 &&
      loan?.signed_agreements &&
      (loan?.signed_agreements).length > 0
    ) {
      if (Array.isArray(loan?.signed_agreements)) {
        return loan.signed_agreements.map(agreement => ({
          name: agreement.agreement_type,
          agreement_url: agreement.agreement_url,
          created_date: agreement.created_date
        }));
      }
      return [];
    } else if (
      getAgreementTemplateDto.agreement_type == 2 &&
      loan?.signed_fullfillment_agreement
    ) {
      const agreement = loan.signed_fullfillment_agreement;
      return [{
        name: agreement.agreement_type,
        agreement_url: agreement.agreement_url,
        created_date: agreement.created_date
      }];
    } else if (
      getAgreementTemplateDto.agreement_type == 3 &&
      loan?.signed_liquidate_agreement
    ) {
      const agreement = loan.signed_liquidate_agreement;
      return [{
        name: agreement.agreement_type,
        agreement_url: agreement.agreement_url,
        created_date: agreement.created_date
      }];
    }
    const customer = await this.customerService.getUserProfile(
      loan.customer_id.toString(),
      db_name,
    );

    const agreementTemplateDetails = await this.agreementTemplateModel
      .find({ agreement_type: getAgreementTemplateDto.agreement_type })
      .sort({ priority: 1 })
      .exec();

    if (agreementTemplateDetails.length === 0) {
      throw new NotFoundException(i18n.t(`lang.agreement.not_found`));
    }

    const customerData = { ...customer.toObject() };

    customerData.customer_name = `${customerData.first_name} ${customerData.last_name}`;
    customerData.liquidate_number = loan?.liquidate_number;

    agreementTemplateDetails.forEach((template) => {
      Object.keys(customerData).forEach((key) => {
        const templateKey = `{{${key}}}`;
        const regex = new RegExp(templateKey, 'g');
        template.body = template.body.replace(regex, customerData[key]);
      });
    });
    return agreementTemplateDetails;
  }

  async getAllAgreementTemplate(user_id: string, db_name: string) {
    this.agreementTemplateModel = setTanantConnection(
      db_name,
      AgreementTemplate.name,
      AgreementTemplateSchema,
    );

    const agreementTemplateDetails = await this.agreementTemplateModel
      .find({})
      .exec();

    return agreementTemplateDetails;
  }
}

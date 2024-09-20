import { REQUEST } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { ContectUs, ContectUsSchema } from './schmas/contactus.schema';
import mongoose, { Model } from 'mongoose';
import { ContactUsDto } from './dtos/contextus.dto';
import {
  ContectDetails,
  ContectDetailsSchma,
} from './schemas/contactDetails.schema';
import { ContactDetailsDto } from './dtos/contactDetails.dto';
import { GetContactDetailsDto } from './dtos/getContact.dto';
import { deleteContactDetailsDto } from './dtos/deleteContactDetails.dto';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { Support, SupportSchema } from './schmas/support.schema';

@Injectable()
export class ContectusService {
  public contectusModel: Model<ContectUs>;
  public supportModel: Model<Support>;
  public ContactDetailsModel: Model<ContectDetails>;
  constructor() {}

  async CreateTicketContactUs(body: ContactUsDto, db_name: string) {
    this.contectusModel = setTanantConnection(
      db_name,
      ContectUs.name,
      ContectUsSchema,
    );
    const newTicket = new this.contectusModel({ ...body });
    // SaveBase64Image(body.attachment, newTicket._id.toString());
    // newTicket.attachment = newTicket._id + '.jpeg';
    await newTicket.save();
    return newTicket;
  }

  async CreateTicketSupport(body: ContactUsDto, id: string, db_name: string) {
    this.supportModel = setTanantConnection(
      db_name,
      Support.name,
      SupportSchema,
    );
    const newTicket = new this.supportModel({ ...body, user_id: id });
    // SaveBase64Image(body.attachment, newTicket._id.toString());
    // newTicket.attachment = newTicket._id + '.jpeg';
    await newTicket.save();
    return newTicket;
  }

  async AddContectDetails(body: ContactDetailsDto, db_name: string) {
    this.ContactDetailsModel = setTanantConnection(
      db_name,
      ContectDetails.name,
      ContectDetailsSchma,
    );
    const NewDetails = new this.ContactDetailsModel(body);
    await NewDetails.save();
    return NewDetails;
  }

  async GetContectDetails(body: GetContactDetailsDto, db_name: string) {
    this.ContactDetailsModel = setTanantConnection(
      db_name,
      ContectUs.name,
      ContectUsSchema,
    );
    const query: { store_id?: mongoose.Types.ObjectId } = {};

    if (body?.store_id) {
      query.store_id = new mongoose.Types.ObjectId(body.store_id);
    }
    
    const NewDetails = await this.ContactDetailsModel.find(query as any);
    return NewDetails;
  }

  async DeleteContectDetails(body: deleteContactDetailsDto, db_name: string) {
    this.ContactDetailsModel = setTanantConnection(
      db_name,
      ContectDetails.name,
      ContectDetailsSchma,
    );
    const Details = await this.ContactDetailsModel.findOneAndDelete(body);
    return Details;
  }

  async updateContectDetails(body: deleteContactDetailsDto, db_name: string) {
    this.ContactDetailsModel = setTanantConnection(
      db_name,
      ContectDetails.name,
      ContectDetailsSchma,
    );
    const { _id, store_id } = body;
    const Details = await this.ContactDetailsModel.findOneAndUpdate(
      { store_id, _id },
      body.data,
    );
    return Details;
  }
}

import {  Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400 } from 'src/utils/http-code.util';
import { CustomerInsight, CustomerInsightSchema } from '../schema/customer_insight.schema';
import { date_moment } from 'src/utils/date.util';
import { CustomerInsightDTO } from '../dto/customer_insight.dto';

@Injectable()
export class CustomerInsightService {
    public customerInsightModel: Model<any>;

    constructor() { }

   

    async getPersonalInsight(id: string, db_name: string): Promise<CustomerInsight | false> {
        this.customerInsightModel = setTanantConnection(
            db_name,
            CustomerInsight.name,
            CustomerInsightSchema,
        );

        let user;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            user = await this.customerInsightModel.findOne({ customer_id: id })
                .sort({ create_date: -1 })
                .exec();
        }

        return user ? user : false;
    }
    async addUpdatePersonalInsight(
        user_id: string,
        customerInsightDTO: CustomerInsightDTO,
        db_name: string,
    ): Promise<CustomerInsight | boolean> {
        this.customerInsightModel = setTanantConnection(
            db_name,
            CustomerInsight.name,
            CustomerInsightSchema,
        );

        if (customerInsightDTO.customer_insight_id) {
            const existingInsight = await this.customerInsightModel.findOne({
                _id: customerInsightDTO.customer_insight_id,
                customer_id: user_id
            }).exec();

            if (!existingInsight) {
                return false;
            }

            customerInsightDTO.update_date = date_moment();
            const updatedInsight = await this.customerInsightModel.findOneAndUpdate(
                { _id: customerInsightDTO.customer_insight_id },
                {
                    $set: {
                        ...customerInsightDTO,
                        update_date: date_moment()
                    },
                },
                { new: true },
            ).exec();
            return updatedInsight;
        } else {
            customerInsightDTO.create_date = date_moment();
            customerInsightDTO.customer_id = user_id;
            const newCustomerInsight = new this.customerInsightModel(customerInsightDTO);
            await newCustomerInsight.save();
            return newCustomerInsight;
        }
    }



}

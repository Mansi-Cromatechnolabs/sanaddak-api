import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Model } from 'mongoose';
import { StaffRegistertDTO } from './dto/registration.dto';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400 } from 'src/utils/http-code.util';
import { bcryptPassword } from 'src/utils/helper';
import { Staff, StaffSchema } from './schema/staff.schema';

@Injectable()
export class StaffService {

    public staffModel: Model<any>;

    constructor(
    ) { }

    async staffRegistration(
        staffRegistertDTO: StaffRegistertDTO,
        db_name: string,
    ): Promise<any> {
        this.staffModel = setTanantConnection(
            db_name,
            Staff.name,
            StaffSchema,
        );
        const existingUser = await this.staffModel.findOne({
            $or: [
                { email: staffRegistertDTO.email, is_active: true },
                { phone: staffRegistertDTO.phone, is_active: true },
            ],
        });

        if (existingUser) {
            throw new BadRequestException({
                message: 'Staff already exists with given email or phone number.',
                status: _400,
            });
        }

        const hashedPassword = await bcryptPassword(staffRegistertDTO.password);

        const newUser = new this.staffModel({
            ...staffRegistertDTO,
            password: hashedPassword,
            is_active: true,
        });

        const savedUser = await newUser.save();

        await savedUser.save();
        return {
            id: savedUser._id,
            first_name: savedUser?.first_name,
            last_name: savedUser?.last_name,
            email: savedUser?.email,
            country_code: savedUser?.country_code,
            phone: savedUser.phone,
            is_active: savedUser.is_active,
        };
    }




}

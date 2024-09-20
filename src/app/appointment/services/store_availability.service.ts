import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { AppointmentService } from './appointment.service';
import {
  BranchTimeAvailability,
  BranchTimeAvailabilitySchema,
  BranchDayAvailability,
  BranchDayAvailabilitySchema,
} from '../schema/appointment_config.schema';
import {
  AppointmentAvailability,
  BranchTimeAvailabilityDTO,
  BranchDayAvailabilityDTO,
  StoresDayDTO,
  TimeSlotDTO,
} from '../dto/appointment_config.dto';
import { I18nContext } from 'nestjs-i18n';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { _400, _404 } from 'src/utils/http-code.util';
import { GlobalConfigService } from '../../global_config/global_config.service';
import { comman_slot_date, TIMEZONE_UTC } from 'src/utils/date.util';
import { ConvertTimeStringToMinutes } from 'src/utils/formate.util';

@Injectable()
export class StoreAvailabilityService {
  public branchTimeAvailabilityDTOModel: Model<any>;
  public branchDayAvailabilityModel: Model<any>;

  constructor(
    @Inject(forwardRef(() => AppointmentService))
    private readonly appointmentService: AppointmentService,
    @Inject(forwardRef(() => GlobalConfigService))
    private readonly configService: GlobalConfigService,
  ) {}

  async createBranchDayAvailability(
    branchDayAvailabilityDTO: BranchDayAvailabilityDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.branchDayAvailabilityModel = setTanantConnection(
      db_name,
      BranchDayAvailability.name,
      BranchDayAvailabilitySchema,
    );
    this.branchTimeAvailabilityDTOModel = setTanantConnection(
      db_name,
      BranchTimeAvailability.name,
      BranchTimeAvailabilitySchema,
    );
    const existingbranchDayAvailability = await this.branchDayAvailabilityModel
      .findOne({
        day: branchDayAvailabilityDTO.day,
        store_id: branchDayAvailabilityDTO.store_id,
      })
      .exec();

    if (!existingbranchDayAvailability) {
      const newbranchDayAvailability = new this.branchDayAvailabilityModel(
        branchDayAvailabilityDTO,
      );
      await newbranchDayAvailability.save();
      return newbranchDayAvailability;
    } else if (
      existingbranchDayAvailability &&
      existingbranchDayAvailability.is_open === false &&
      branchDayAvailabilityDTO.is_open === true
    ) {
      const updatedbranchDayAvailability =
        await this.branchDayAvailabilityModel.findOneAndUpdate(
          { _id: branchDayAvailabilityDTO.day_master_id },
          {
            $set: {
              is_open: branchDayAvailabilityDTO?.is_open,
            },
          },
          { new: true },
        );
      return updatedbranchDayAvailability;
    } else if (
      existingbranchDayAvailability &&
      existingbranchDayAvailability.is_open === true &&
      branchDayAvailabilityDTO.is_open === false
    ) {
      const branchTimeAvailability = await this.branchTimeAvailabilityDTOModel
        .findOne({ day_master: existingbranchDayAvailability.id })
        .exec();
      const bookedAppointment =
        await this.appointmentService.getBookedUserAppointMent(
          {
            store_id: branchDayAvailabilityDTO.store_id,
            time_slot_id: branchTimeAvailability.id,
          },
          db_name,
        );
      if (bookedAppointment === false) {
        const updatedbranchDayAvailability =
          await this.branchDayAvailabilityModel.findOneAndUpdate(
            { _id: branchDayAvailabilityDTO.day_master_id },
            {
              $set: {
                is_open: branchDayAvailabilityDTO?.is_open,
              },
            },
            { new: true },
          );
        await this.branchTimeAvailabilityDTOModel
          .findByIdAndDelete(branchTimeAvailability.id)
          .exec();
        return updatedbranchDayAvailability;
      } else {
        throw new BadRequestException(
          i18n.t(`lang.appointment.appointment_not_update`),
        );
      }
    } else if (
      existingbranchDayAvailability &&
      existingbranchDayAvailability.is_open === true &&
      branchDayAvailabilityDTO.is_open === true
    ) {
      return existingbranchDayAvailability;
    } else if (
      existingbranchDayAvailability &&
      existingbranchDayAvailability.is_open === false &&
      branchDayAvailabilityDTO.is_open === false
    ) {
      return existingbranchDayAvailability;
    }
  }

  async createBranchTimeAvailabilityr(
    branchTimeAvailabilityDTO: BranchTimeAvailabilityDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    let existingbranchTimeAvailabilityDTO;
    this.branchTimeAvailabilityDTOModel = setTanantConnection(
      db_name,
      BranchTimeAvailability.name,
      BranchTimeAvailabilitySchema,
    );
    if (branchTimeAvailabilityDTO.time_slot_id) {
      existingbranchTimeAvailabilityDTO = await this.getBranchAvailability(
        branchTimeAvailabilityDTO.time_slot_id,
        db_name,
      );
    }
    if (!branchTimeAvailabilityDTO.time_slot_id) {
      const startTimeMinutes = await ConvertTimeStringToMinutes(
        branchTimeAvailabilityDTO.start_time,
      );
      const endTimeMinutes = await ConvertTimeStringToMinutes(
        branchTimeAvailabilityDTO.end_time,
      );
      const existingAvailability = await this.branchTimeAvailabilityDTOModel
        .find({
          day: branchTimeAvailabilityDTO?.day,
          store_id: branchTimeAvailabilityDTO?.store_id,
        })
        .exec();

      const existingbranchTimeAvailabilityDTO = await (
        await Promise.all(
          existingAvailability.map(async (record) => {
            const recordStartTimeMinutes = await ConvertTimeStringToMinutes(
              record.start_time,
            );
            const recordEndTimeMinutes = await ConvertTimeStringToMinutes(
              record.end_time,
            );

            const case1 =
              startTimeMinutes > recordStartTimeMinutes &&
              startTimeMinutes < recordEndTimeMinutes;
            const case2 =
              endTimeMinutes > recordStartTimeMinutes &&
              endTimeMinutes < recordEndTimeMinutes;
            const case3 =
              endTimeMinutes == recordEndTimeMinutes &&
              startTimeMinutes == recordStartTimeMinutes;
            if (case1 == false && case2 == false && case3 == false) {
              return null;
            } else {
              return record;
            }
          }),
        )
      ).filter((record) => record !== null);

      if (
        existingbranchTimeAvailabilityDTO.length ||
        existingbranchTimeAvailabilityDTO.length > 0
      ) {
        throw new BadRequestException(i18n.t(`lang.appointment.slot_exist`));
      } else {
        const newbranchTimeAvailabilityDTO =
          new this.branchTimeAvailabilityDTOModel(branchTimeAvailabilityDTO);
        await newbranchTimeAvailabilityDTO.save();
        return newbranchTimeAvailabilityDTO;
      }
    }

    if (!existingbranchTimeAvailabilityDTO) {
      const newbranchTimeAvailabilityDTO =
        new this.branchTimeAvailabilityDTOModel(branchTimeAvailabilityDTO);
      await newbranchTimeAvailabilityDTO.save();
      return newbranchTimeAvailabilityDTO;
    } else if (existingbranchTimeAvailabilityDTO) {
      const bookedAppointment =
        await this.appointmentService.getBookedUserAppointMent(
          {
            store_id: branchTimeAvailabilityDTO.store_id,
            time_slot_id: branchTimeAvailabilityDTO.time_slot_id,
          },
          db_name,
        );
      if (
        existingbranchTimeAvailabilityDTO.start_time ===
          branchTimeAvailabilityDTO.start_time &&
        existingbranchTimeAvailabilityDTO.end_time ===
          branchTimeAvailabilityDTO.end_time &&
        existingbranchTimeAvailabilityDTO.max_attendee ===
          branchTimeAvailabilityDTO.max_attendee &&
        bookedAppointment
      ) {
        return existingbranchTimeAvailabilityDTO;
      } else {
        if (bookedAppointment !== false) {
          throw new BadRequestException(
            i18n.t(`lang.appointment.appointment_not_update`),
          );
        }
        const updatedbranchDayAvailability =
          await this.branchTimeAvailabilityDTOModel.findOneAndUpdate(
            { _id: existingbranchTimeAvailabilityDTO._id },
            {
              $set: {
                start_time: branchTimeAvailabilityDTO.start_time,
                end_time: branchTimeAvailabilityDTO.end_time,
                max_attendee: branchTimeAvailabilityDTO.max_attendee,
                is_active: true,
              },
            },
            { new: true },
          );
        return updatedbranchDayAvailability;
      }
    }
  }

  async createAppointmentAvailability(
    appointmentAvailabilityDTO: AppointmentAvailability,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    const day_master = await this.createBranchDayAvailability(
      {
        day: appointmentAvailabilityDTO.day,
        is_open: appointmentAvailabilityDTO.is_open,
        store_id: appointmentAvailabilityDTO.store_id,
        day_master_id: appointmentAvailabilityDTO?.day_master_id,
      },
      db_name,
      i18n,
    );
    if (!day_master) {
      throw new BadRequestException(
        i18n.t(`lang.appointment.day_master_not_found`),
      );
    }
    if (day_master && appointmentAvailabilityDTO.is_open === true) {
      const promises = appointmentAvailabilityDTO.slots.map(
        async (time_slot) => {
          const branchTimeAvailability = {
            day_master: day_master.id,
            is_active: true,
            store_id: appointmentAvailabilityDTO.store_id,
            day: appointmentAvailabilityDTO.day,
            is_open: appointmentAvailabilityDTO.is_open,
            start_time: time_slot.start_time,
            end_time: time_slot?.end_time,
            max_attendee: time_slot.max_attendee,
            time_slot_id: time_slot?.['id'],
          };
          const branchTimeAvailabilityDTO =
            await this.createBranchTimeAvailabilityr(
              branchTimeAvailability,
              db_name,
              i18n,
            );
          return {
            id: branchTimeAvailabilityDTO.id,
            start_time: branchTimeAvailabilityDTO.start_time,
            end_time: branchTimeAvailabilityDTO?.end_time,
            max_attendee: branchTimeAvailabilityDTO.max_attendee,
            is_active: branchTimeAvailabilityDTO.is_active,
          };
        },
      );

      const slots = await Promise.all(promises);

      return {
        day_master_id: day_master.id,
        store_id: appointmentAvailabilityDTO.store_id,
        day: appointmentAvailabilityDTO.day,
        is_open: day_master.is_open,
        slots,
      };
    } else {
      return {
        day_master_id: day_master.id,
        store_id: appointmentAvailabilityDTO.store_id,
        day: appointmentAvailabilityDTO.day,
        is_open: day_master.is_open,
        slots: [],
      };
    }
  }

  async getBranchAvailability(id: string, db_name: string): Promise<any> {
    let appointment;
    this.branchTimeAvailabilityDTOModel = setTanantConnection(
      db_name,
      BranchTimeAvailability.name,
      BranchTimeAvailabilitySchema,
    );
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      appointment = await this.branchTimeAvailabilityDTOModel
        .findById({ _id: id })
        .exec();
    }
    return appointment ? appointment : false;
  }

  async updateBranchAvailability(
    id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    try {
      this.branchTimeAvailabilityDTOModel = setTanantConnection(
        db_name,
        BranchTimeAvailability.name,
        BranchTimeAvailabilitySchema,
      );

      const branchTimeAvailability = await this.branchTimeAvailabilityDTOModel
        .findByIdAndUpdate(
          { _id: id },
          { $set: { is_active: false } },
          { new: true },
        )
        .exec();

      if (!branchTimeAvailability) {
        throw new NotFoundException(i18n.t(`lang.appointment.not_found`));
      }

      return branchTimeAvailability;
    } catch (error) {
      throw new NotFoundException({
        message: `Error updating Appointment Master: ${error.message}`,
        status: _404,
      });
    }
  }

  async getNextDays(numberOfDays: number): Promise<string[]> {
    const today = new Date();
    return Array.from({ length: numberOfDays }, (_, i) => {
      const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      return date.toLocaleDateString('default', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    });
  }

  async convertTo24Hour(time: any): Promise<any> {
    const components = time.match(/(\d{1,2}):(\d{2}) (AM|PM)?/);
    const hour = parseInt(components[1]);
    const minute = components[2];
    let hour24;

    if (components[3] === 'PM' && hour < 12) {
      hour24 = hour + 12;
    } else {
      hour24 = hour;
    }

    return `${hour24}:${minute}`;
  }

  async getDaysStatus(
    i18n: I18nContext,
    storesDayDTO: StoresDayDTO,
    db_name: string,
  ): Promise<any> {
    try {
      this.branchDayAvailabilityModel = setTanantConnection(
        db_name,
        BranchDayAvailability.name,
        BranchDayAvailabilitySchema,
      );
      const days = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];
      const daysAppointments = await Promise.all(
        days.map(async (day) => {
          const dbResponse = await this.branchDayAvailabilityModel.find({
            day: day.toLowerCase(),
            store_id: storesDayDTO.store_id,
          });
          return {
            day: i18n.t(`lang.days.${day.toLowerCase()}`),
            is_open: dbResponse.length > 0 ? dbResponse[0]?.is_open : false,
            store_id: storesDayDTO.store_id,
          };
        }),
      );
      return daysAppointments;
    } catch (error) {
      throw error;
    }
  }

  async getDaysAppointment(
    i18n: I18nContext,
    storesDayDTO: StoresDayDTO,
    db_name: string,
  ): Promise<any[]> {
    try {
      this.branchDayAvailabilityModel = setTanantConnection(
        db_name,
        BranchDayAvailability.name,
        BranchDayAvailabilitySchema,
      );
      this.branchTimeAvailabilityDTOModel = setTanantConnection(
        db_name,
        BranchTimeAvailability.name,
        BranchTimeAvailabilitySchema,
      );
      const configDay = await this.configService.getGlobalConfig(
        {
          key: 'appointment_show_days',
        },
        db_name,
        i18n,
      );
      const nextDays = await this.getNextDays(configDay);

      const [dbResponse, currentTime, currentTimePlus2Hours] =
        await Promise.all([
          this.branchDayAvailabilityModel.find({
            store_id: storesDayDTO.store_id,
          }),
          new Date(),
          new Date(Date.now() + 2 * 60 * 60 * 1000),
        ]);

      const daysAppointments = await Promise.all(
        nextDays.map(async (day) => {
          const [dayOfWeek, monthDate, dayOfMonth] = day.split(', ');
          const [month, date] = monthDate.split(' ');
          const translatedMonth = i18n.t(`lang.months.${month.toLowerCase()}`);
          const dayDate = `${date} ${translatedMonth} ${dayOfMonth}`;
          const dayStatus = dbResponse.find(
            (item) => item.day.toLowerCase() === dayOfWeek.toLowerCase(),
          );

          const slots = await this.branchTimeAvailabilityDTOModel.find({
            day: dayOfWeek.toLowerCase(),
            store_id: storesDayDTO.store_id,
          });

          const formattedSlots = await Promise.all(
            slots.map(async (slot) => {
              const appointments =
                await this.appointmentService.getUserAppointMents(
                  {
                    store_id: storesDayDTO.store_id,
                    time_slot_id: slot.id,
                    booking_date: comman_slot_date(dayDate, TIMEZONE_UTC),
                  },
                  db_name,
                );
              const startTime = new Date(
                `${date} ${translatedMonth} ${dayOfMonth} ${await this.convertTo24Hour(slot.start_time)}`,
              );
              if (startTime >= currentTimePlus2Hours) {
                return {
                  id: slot._id,
                  start_time: slot.start_time,
                  end_time: slot.end_time,
                  limit: slot.limit,
                  available_slots: slot.max_attendee - appointments.length,
                  is_active: appointments.length < slot.max_attendee,
                  startTimeMinutes: (await ConvertTimeStringToMinutes(
                    slot.start_time,
                  )) as number,
                };
              }
              return null;
            }),
          );
          const sortedSlots = formattedSlots
            .filter(Boolean)
            .sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);
          const filteredSlots = sortedSlots.filter(Boolean);
          return {
            id: dayStatus ? dayStatus._id : null,
            store_id: storesDayDTO.store_id,
            day: i18n.t(`lang.days.${dayOfWeek.toLowerCase()}`),
            date: comman_slot_date(dayDate, TIMEZONE_UTC),
            is_open:
              filteredSlots.length > 0 &&
              (dayStatus ? dayStatus.is_open : false),
            slots: filteredSlots,
          };
        }),
      );

      return daysAppointments;
    } catch (error) {
      throw new BadRequestException({
        message: `Error fetching appointments: ${error.message}`,
        status: _400,
      });
    }
  }
  async deleteTimeSlotDTO(
    timeSlotDTO: TimeSlotDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.branchTimeAvailabilityDTOModel = setTanantConnection(
      db_name,
      BranchTimeAvailability.name,
      BranchTimeAvailabilitySchema,
    );

    const time_slot = await this.getBranchAvailability(timeSlotDTO.id, db_name);
    if (!time_slot) {
      throw new BadRequestException(
        i18n.t(`lang.appointment.timeslot_not_found`),
      );
    }
    const bookedAppointment =
      await this.appointmentService.getBookedUserAppointMent(
        {
          store_id: time_slot.store_id,
          time_slot_id: time_slot.id,
          is_branch_visited: false,
        },
        db_name,
      );
    if (bookedAppointment) {
      throw new BadRequestException(i18n.t(`lang.appointment.unable_delete`));
    }
    const day = await this.branchTimeAvailabilityDTOModel
      .findByIdAndDelete(time_slot.id)
      .exec();
    return {
      message: 'Time slot deleted successfully.',
      data: { day },
    };
  }
  async getSlotDetails(
    storesDayDTO: StoresDayDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.branchDayAvailabilityModel = setTanantConnection(
      db_name,
      BranchDayAvailability.name,
      BranchDayAvailabilitySchema,
    );

    const store = await this.branchDayAvailabilityModel
      .aggregate([
        {
          $match: {
            store_id: new mongoose.Types.ObjectId(storesDayDTO.store_id),
          },
        },
        {
          $lookup: {
            from: 'branchtimeavailabilities',
            localField: '_id',
            foreignField: 'day_master',
            as: 'timeslots',
          },
        },
        {
          $project: {
            _id: 1,
            day: 1,
            is_open: 1,
            timeslots: {
              $cond: {
                if: { $eq: ['$is_open', true] },
                then: {
                  $map: {
                    input: '$timeslots',
                    as: 'timeslots',
                    in: {
                      _id: '$$timeslots._id',
                      start_time: '$$timeslots.start_time',
                      end_time: '$$timeslots.end_time',
                      max_attendee: '$$timeslots.max_attendee',
                      is_active: '$$timeslots.is_active',
                    },
                  },
                },
                else: [],
              },
            },
          },
        },
      ])
      .exec();

    if (!store || store.length === 0) {
      throw new BadRequestException({
        message: i18n.t('lang.store.not_found'),
        data: [],
      });
    }

    const allDaysOfWeek = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    const result = allDaysOfWeek
      .filter(
        (dayOfWeek) =>
          !storesDayDTO.day || dayOfWeek === storesDayDTO.day.toLowerCase(),
      )
      .map((dayOfWeek) => {
        const foundDay = store.find(
          (day) => day.day.toLowerCase() === dayOfWeek,
        );
        return {
          _id: foundDay?._id || '',
          day: foundDay?.day
            ? i18n.t(`lang.days.${foundDay?.day}`)
            : i18n.t(`lang.days.${dayOfWeek}`),
          is_open: foundDay?.is_open || false,
          timeslots: foundDay?.timeslots || [],
        };
      });

    const finalResult = storesDayDTO.day
      ? result[0] || {
          _id: '',
          day: i18n.t(`lang.days.${storesDayDTO.day}`),
          is_open: false,
          timeslots: [],
        }
      : result;

    return finalResult;
  }
}

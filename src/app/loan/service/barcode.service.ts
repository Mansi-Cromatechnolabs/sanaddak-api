import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { I18nContext } from 'nestjs-i18n';
import { Loan, LoanSchema } from '../schema/loan.schema';
import { printBarcode } from 'src/utils/barcode.util';
import { GoldItem, GoldItemSchema } from '../schema/gold_item.schema';
import {
  BarcodeDetails,
  BarcodeDetailsSchema,
} from '../schema/barcode_master.schema';
import {
  AssignBarcodeDTO,
  CreateBarcodeDTO,
  DisputeGenerateDTO,
  UpdateBarcodeDetails,
} from '../dto/barcode_master.dto';
import { date_moment } from 'src/utils/date.util';
import { StoreService } from 'src/app/store/store.service';
import {
  CreateDebitCreditNoteItemDTO,
  CreateDebitCreditNotesDTO,
  VerifyGoldItem,
} from '../dto/debit_credit_notes.dto';
import {
  DebitCreditNotes,
  DebitCreditNotesSchema,
} from '../schema/debit_credit_note.schema';
import { GoldLoanService } from 'src/app/gold_loan/gold_loan.service';
import {
  DebitCreditNoteItems,
  DebitCreditNoteItemsSchema,
} from '../schema/debit_credit_note_items.schema';

@Injectable()
export class BarcodeService {
  public loanModel: Model<any>;
  public goldItemModel: Model<any>;
  public loanEmiModel: Model<any>;
  public appointmentModel: Model<any>;
  public customerModel: Model<any>;
  public valuationModel: Model<any>;
  public barcodeModel: Model<any>;
  public debitCreditNoteModel: Model<any>;
  public debitCreditNoteItemsModel: Model<any>;

  constructor(
    @Inject(forwardRef(() => StoreService))
    private readonly storeService: StoreService,
    @Inject(forwardRef(() => GoldLoanService))
    private readonly goldLoanService: GoldLoanService,
  ) {}

  async generateUniqueKey(): Promise<any> {
    const timestamp = Date.now();
    const randomPart = Math.floor(Math.random() * 1000000);
    const combined =
      timestamp.toString() + randomPart.toString().padStart(6, '0');
    return combined.slice(-13);
  }

  async getLoanDetails(
    loan_id: string,
    item_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    this.goldItemModel = setTanantConnection(
      db_name,
      GoldItem.name,
      GoldItemSchema,
    );

    const matchConditions = {
      liquidate_number: loan_id,
    };
    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'branches',
          localField: 'branch_id',
          foreignField: '_id',
          as: 'branch',
        },
      },
      { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'golditems',
          let: { loan_valuation_id: '$valuation_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$valuation_id', '$$loan_valuation_id'],
                },
              },
            },
          ],
          as: 'gold_items',
        },
      },
      {
        $lookup: {
          from: 'customer',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $unwind: {
          path: '$customer_details',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          loan_id: '$_id',
          liquidate_number: 1,
          branch_id: 1,
          customer_id: '$customer_id',
          branch_key: { $ifNull: ['$branch.branch_key', ' '] },
          liquidity_barcode: { $ifNull: ['$liquidity_barcode', ' '] },
          gold_items: {
            $map: {
              input: '$gold_items',
              as: 'item',
              in: {
                gold_item_id: { $ifNull: ['$$item._id', ''] },
                gold_item_name: { $ifNull: ['$$item.name', ''] },
                gold_asset_images: { $ifNull: ['$$item.asset_images', ''] },
                gold_item_barcode: {
                  $ifNull: ['$$item.gold_item_barcode', ''],
                },
                status: '',
                specification: '',
              },
            },
          },
          customer: {
            customer_id: '$customer_details._id',
            full_name: {
              $concat: [
                { $ifNull: ['$customer_details.first_name', ''] },
                ' ',
                { $ifNull: ['$customer_details.last_name', ''] },
              ],
            },
            profile_image: { $ifNull: ['$customer_details.profile_image', ''] },
            email: { $ifNull: ['$customer_details.email', ''] },
            phone: {
              $concat: [
                { $ifNull: ['$customer_details.country_code', ''] },
                ' ',
                { $ifNull: ['$customer_details.phone', ''] },
              ],
            },
          },
        },
      },
    ];

    const result = await this.loanModel.aggregate(pipeline).exec();

    if (result.length === 0) {
      throw new Error(i18n.t(`lang.loan.loan_not_found`));
    }
    return result[0];
  }

  async generateBarcode(
    type: number,
    store_id: string,
    db_name: string,
    i18n: I18nContext,
    liquidity_barcode?: string,
  ): Promise<any> {
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);
    this.goldItemModel = setTanantConnection(
      db_name,
      GoldItem.name,
      GoldItemSchema,
    );
    const storeData = await this.storeService.getStoreById(store_id, db_name);
    const uniqueKey = await this.generateUniqueKey();
    let barcodeData: string;
    barcodeData = `${storeData.branch_key}${uniqueKey}`;
    if (type == 3) {
      const barcode_url = await printBarcode(barcodeData, 'container_barcode');
      return {
        container_barcode: barcodeData,
        container_barcode_url: barcode_url,
      };
    } else if (type == 2) {
      const loan = await this.getBarcodeDetails(db_name, {
        type: 2,
        barcode_number: liquidity_barcode,
      });
      const barcode = await printBarcode(
        barcodeData,
        'liquidity_barcode',
        loan?.liquidate_number,
        (loan?.customer_id).toString(),
      );
      return {
        liquidity_id: loan?.liquidity_id,
        liquidity_number: loan?.liquidate_number,
        old_liquidity_barcode: loan?.barcode,
        new_liquidity_barcode: barcodeData,
        new_liquidity_barcode_url: barcode,
      };
    } else {
      return {
        barcode_number: barcodeData,
      };
    }
  }

  async getAllLoanLists(
    db_name: string,
    i18n: I18nContext,
    store_id?: string,
    liquidity_number?: string,
  ): Promise<any> {
    this.barcodeModel = setTanantConnection(
      db_name,
      BarcodeDetails.name,
      BarcodeDetailsSchema,
    );

    if (liquidity_number) {
      const loan = await this.getLoanDetails(
        liquidity_number,
        '',
        db_name,
        i18n,
      );
      const liquidity_barcode = await this.barcodeModel
        .findOne({
          liquidity_id: loan?._id,
          type: 2,
        })
        .exec();
      if (liquidity_barcode) {
        loan.liquidity_barcode = liquidity_barcode.barcode;
      }
      loan.gold_items = await Promise.all(
        loan.gold_items.map(async (gold_item, i) => {
          const gold_item_barcode = await this.barcodeModel
            .findOne({
              liquidity_id: loan?._id,
              gold_piece_id: gold_item.gold_item_id,
              type: 1,
            })
            .exec();
          if (gold_item_barcode) {
            gold_item.gold_item_barcode = gold_item_barcode.barcode;
            gold_item.status = gold_item_barcode?.status;
          }

          return gold_item;
        }),
      );

      return loan;
    }

    const pipeline = [
      {
        $match: {
          type: 2,
          $or: [
            { container_number: { $exists: false } },
            { container_number: null },
          ],
        },
      },
      {
        $lookup: {
          from: 'loans',
          localField: 'liquidity_id',
          foreignField: '_id',
          as: 'loan_details',
        },
      },
      {
        $unwind: {
          path: '$loan_details',
          preserveNullAndEmptyArrays: true,
        },
      },
      ...(store_id
        ? [
            {
              $match: {
                'loan_details.branch_id': new mongoose.Types.ObjectId(store_id),
              },
            },
          ]
        : []),
      {
        $lookup: {
          from: 'customer',
          localField: 'loan_details.customer_id',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $unwind: {
          path: '$customer_details',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          type: 1,
          container_number: { $ifNull: ['$container_number', ''] },
          liquidity_id: 1,
          liquidity_barcode: '$barcode',
          liquidity_barcode_url: '$barcode_url',
          loan_liquidate_number: '$loan_details.liquidate_number',
          liquidity_created_date: '$loan_details.transaction_date',
          customer: {
            customer_id: '$customer_details._id',
            full_name: {
              $concat: [
                { $ifNull: ['$customer_details.first_name', ''] },
                ' ',
                { $ifNull: ['$customer_details.last_name', ''] },
              ],
            },
            profile_image: { $ifNull: ['$customer_details.profile_image', ''] },
            email: { $ifNull: ['$customer_details.email', ''] },
            phone: {
              $concat: [
                { $ifNull: ['$customer_details.country_code', ''] },
                ' ',
                { $ifNull: ['$customer_details.phone', ''] },
              ],
            },
          },
        },
      },
    ];
    const loans = await this.barcodeModel.aggregate(pipeline);

    if (loans.length === 0) {
      return [];
    }
    return loans;
  }

  async createBarcode(
    CreateBarcodeDTO: CreateBarcodeDTO,
    db_name: string,
  ): Promise<any> {
    this.barcodeModel = setTanantConnection(
      db_name,
      BarcodeDetails.name,
      BarcodeDetailsSchema,
    );
    const newItemBarcode = new this.barcodeModel({
      ...CreateBarcodeDTO,
      created_date: date_moment(),
    });
    try {
      await newItemBarcode.save();
    } catch (error) {
      console.error('Error saving barcode:', error);
      throw error;
    }
    return newItemBarcode;
  }

  async getBarcodeDetails(
    db_name: string,
    assignBarcodeDTO: AssignBarcodeDTO,
  ): Promise<any> {
    this.barcodeModel = setTanantConnection(
      db_name,
      BarcodeDetails.name,
      BarcodeDetailsSchema,
    );

    const { type, barcode_number } = assignBarcodeDTO;

    try {
      let aggregationPipeline;
      if (type == 3) {
        aggregationPipeline = [
          {
            $match: {
              type: type,
              barcode: barcode_number,
            },
          },
          {
            $lookup: {
              from: 'loans',
              let: { liquidity_ids: '$container_liquidity_details' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $in: ['$_id', '$$liquidity_ids'],
                    },
                  },
                },
                {
                  $project: {
                    liquidate_number: 1,
                    customer_id: 1,
                    branch_id: 1,
                    gold_piece_value: 1,
                  },
                },
              ],
              as: 'liquidity_details',
            },
          },
          {
            $addFields: {
              liquidity_details: {
                $map: {
                  input: '$liquidity_details',
                  as: 'loan',
                  in: {
                    liquidity_id: '$$loan._id',
                    liquidate_number: '$$loan.liquidate_number',
                    customer_id: '$$loan.customer_id',
                    branch_id: '$$loan.branch_id',
                    gold_piece_value: '$$loan.gold_piece_value',
                  },
                },
              },
            },
          },
        ];
      } else if (type == 2) {
        aggregationPipeline = [
          {
            $match: {
              type,
              barcode: assignBarcodeDTO?.barcode_number,
            },
          },
          {
            $lookup: {
              from: 'barcodedetails',
              localField: 'liquidity_id',
              foreignField: 'liquidity_id',
              as: 'gold_items',
            },
          },
          {
            $addFields: {
              gold_items: {
                $map: {
                  input: {
                    $filter: {
                      input: '$gold_items',
                      as: 'item',
                      cond: { $eq: ['$$item.type', 1] },
                    },
                  },
                  as: 'item',
                  in: {
                    gold_piece_id: '$$item.gold_piece_id',
                    gold_piece_barcode: '$$item.barcode',
                    gold_piece_barcode_url: '$$item.barcode_url',
                  },
                },
              },
            },
          },
          {
            $lookup: {
              from: 'loans',
              localField: 'liquidity_id',
              foreignField: '_id',
              as: 'loan_details',
            },
          },
          {
            $addFields: {
              liquidate_number: {
                $arrayElemAt: ['$loan_details.liquidate_number', 0],
              },
              branch_id: {
                $arrayElemAt: ['$loan_details.branch_id', 0],
              },
              gold_price_24_karate: {
                $arrayElemAt: ['$loan_details.gold_price_24_karate', 0],
              },
              gold_piece_value: {
                $arrayElemAt: ['$loan_details.gold_piece_value', 0],
              },
              customer_id: {
                $arrayElemAt: ['$loan_details.customer_id', 0],
              },
              customer_cash_needs: {
                $arrayElemAt: ['$loan_details.customer_cash_needs', 0],
              },
            },
          },
          {
            $lookup: {
              from: 'golditems',
              localField: 'gold_items.gold_piece_id',
              foreignField: '_id',
              as: 'gold_item_details',
            },
          },
          {
            $addFields: {
              gold_items: {
                $map: {
                  input: '$gold_items',
                  as: 'item',
                  in: {
                    gold_piece_id: '$$item.gold_piece_id',
                    gold_piece_barcode: '$$item.gold_piece_barcode',
                    gold_piece_barcode_url: '$$item.gold_piece_barcode_url',
                    gold_weight: {
                      $arrayElemAt: ['$gold_item_details.gold_weight', 0],
                    },
                    gold_purity_entered_per_1000: {
                      $arrayElemAt: [
                        '$gold_item_details.gold_purity_entered_per_1000',
                        0,
                      ],
                    },
                  },
                },
              },
            },
          },
          {
            $lookup: {
              from: 'barcodedetails',
              localField: 'container_number',
              foreignField: 'container_number',
              as: 'container_details',
            },
          },
          {
            $addFields: {
              container_id: {
                $arrayElemAt: [
                  {
                    $map: {
                      input: {
                        $filter: {
                          input: '$container_details',
                          as: 'container',
                          cond: { $eq: ['$$container.type', 3] },
                        },
                      },
                      as: 'container',
                      in: '$$container._id',
                    },
                  },
                  0,
                ],
              },
            },
          },
          {
            $project: {
              gold_items: 1,
              liquidate_number: 1,
              liquidity_id: 1,
              barcode: 1,
              barcode_url: 1,
              branch_id: 1,
              gold_price_24_karate: 1,
              gold_piece_value: 1,
              customer_id: 1,
              container_number: 1,
              container_id: 1,
              customer_cash_needs: 1,
              _id: 0,
            },
          },
        ];
      } else if (type == 1) {
        aggregationPipeline = [
          {
            $match: {
              type,
              barcode: assignBarcodeDTO?.barcode_number,
            },
          },
          {
            $lookup: {
              from: 'golditems',
              localField: 'gold_piece_id',
              foreignField: '_id',
              as: 'gold_item_info',
            },
          },
          {
            $addFields: {
              gold_item_details: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$gold_item_info',
                      as: 'item',
                      cond: { $eq: ['$$item._id', '$gold_piece_id'] },
                    },
                  },
                  0,
                ],
              },
            },
          },
          {
            $addFields: {
              gold_piece_name: '$gold_item_details.name',
              gold_piece_image_url: '$gold_item_details.asset_images',
              gold_piece_weight: '$gold_item_details.gold_weight',
              gold_piece_purity:
                '$gold_item_details.gold_purity_entered_per_1000',
              valuation_id: '$gold_item_details.valuation_id',
            },
          },
          {
            $lookup: {
              from: 'loans',
              localField: 'valuation_id',
              foreignField: 'valuation_id',
              as: 'loan_info',
            },
          },
          {
            $addFields: {
              gold_price_24_karate: {
                $arrayElemAt: ['$loan_info.gold_price_24_karate', 0],
              },
              customer_id: { $arrayElemAt: ['$loan_info.customer_id', 0] },
              branch_id: { $arrayElemAt: ['$loan_info.branch_id', 0] },
              gold_piece_value: {
                $arrayElemAt: ['$loan_info.gold_piece_value', 0],
              },
              liquidate_number: {
                $arrayElemAt: ['$loan_info.liquidate_number', 0],
              },
            },
          },
          {
            $project: {
              gold_piece_name: 1,
              liquidity_id: 1,
              gold_piece_image_url: 1,
              gold_piece_id: 1,
              gold_piece_barcode: '$barcode',
              gold_piece_barcode_url: '$barcode_url',
              gold_piece_weight: 1,
              gold_piece_purity: 1,
              valuation_id: 1,
              gold_price_24_karate: 1,
              customer_id: 1,
              liquidate_number: 1,
              branch_id: 1,
              gold_piece_value: 1,
              status: 1,
              _id: 0,
            },
          },
        ];
      }
      const [barcodeDetails] = await this.barcodeModel
        .aggregate(aggregationPipeline)
        .exec();
      if (!barcodeDetails) {
        throw new Error(
          `No barcode details found for type: ${type} and barcode_number: ${barcode_number}`,
        );
      }
      return barcodeDetails;
    } catch (error) {
      console.error(
        'Error retrieving barcode details with liquidate numbers:',
        error,
      );
      throw new Error(`Failed to retrieve barcode details: ${error.message}`);
    }
  }

  async updateBarcodeDetails(
    db_name: string,
    updateBarcodeDetails: UpdateBarcodeDetails,
  ): Promise<any> {
    this.barcodeModel = setTanantConnection(
      db_name,
      BarcodeDetails.name,
      BarcodeDetailsSchema,
    );
    const {
      type,
      liquidity_id,
      container_number,
      new_liquidity_barcode,
      new_barcode_url,
    } = updateBarcodeDetails;

    try {
      const updateResult = await this.barcodeModel.updateOne(
        { type, liquidity_id },
        {
          $set: {
            container_number: container_number,
            new_barcode: new_liquidity_barcode,
            new_barcode_url,
          },
        },
      );

      if (updateResult.matchedCount === 0) {
        throw new Error(
          `No document found matching type: ${type} and liquidity_id: ${liquidity_id}`,
        );
      }

      return updateResult;
    } catch (error) {
      console.error('Error updating barcode details:', error);
      throw new Error(`Failed to update barcode details: ${error.message}`);
    }
  }

  async generateGoldPieceBarcode(
    barcodeData,
    liquidity_number,
    db_name,
    i18n,
    gold_piece_id,
  ): Promise<any> {
    const loan = await this.getLoanDetails(liquidity_number, '', db_name, i18n);
    const barcode = await printBarcode(
      barcodeData,
      'gold_piece_barcode',
      liquidity_number,
      (loan?.customer_id).toString(),
      gold_piece_id,
    );
    const barcode_url = await this.createBarcode(
      {
        liquidity_id: loan?._id,
        gold_piece_id: gold_piece_id,
        type: 1,
        barcode: barcodeData,
        barcode_url: barcode,
        status: 1,
      },
      db_name,
    );
    return barcode_url;
  }

  async assignBarcode(
    assignBarcodeDTO: AssignBarcodeDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    const {
      liquidity_number,
      type,
      barcode_number,
      liquidity_details,
      new_liquidity_barcode,
    } = assignBarcodeDTO;
    this.loanModel = setTanantConnection(db_name, Loan.name, LoanSchema);

    if (type == 3) {
      const uniqueKey = await this.generateUniqueKey();
      const container_number = `CO${uniqueKey}`;
      const container_barcode_assign = await this.createBarcode(
        {
          container_liquidity_details: liquidity_details.map(
            (item) => item.liquidity_id,
          ),
          type: type,
          barcode: barcode_number,
          barcode_url: `${process.env.NEST_PUBLIC_S3_URL}container_barcode_${barcode_number}.png`,
          status: 1,
          container_number: container_number,
        },
        db_name,
      );
      await Promise.all(
        liquidity_details.map((item) =>
          this.updateBarcodeDetails(db_name, {
            type: 2,
            liquidity_id: item.liquidity_id,
            container_number,
          }),
        ),
      );
      return {
        container_id: container_barcode_assign?._id,
        container_number: container_barcode_assign?.container_number,
        container_barcode: container_barcode_assign?.barcode,
        container_barcode_url: container_barcode_assign?.barcode_url,
        liquidity_count:
          (container_barcode_assign?.container_liquidity_details).length,
        liquidity_details: liquidity_details,
      };
    } else if (type == 2) {
      const loan = await this.getLoanDetails(
        liquidity_number,
        '',
        db_name,
        i18n,
      );
      const goldItems = await this.getAllLoanLists(
        db_name,
        i18n,
        '',
        loan?.liquidate_number,
      );
      let liquidity_barcode;
      let barcodeDetails;
      const uniqueKey = await this.generateUniqueKey();
      const barcodeData = `${loan.branch_key}${uniqueKey}`;
      if (goldItems?.liquidity_barcode == ' ' || '') {
        const barcode = await printBarcode(
          barcodeData,
          'liquidity_barcode',
          liquidity_number,
          (loan?.customer_id).toString(),
        );
        liquidity_barcode = await this.createBarcode(
          {
            liquidity_id: loan?._id,
            type: 2,
            barcode: barcodeData,
            barcode_url: barcode,
            status: 1,
          },
          db_name,
        );
      } else {
        barcodeDetails = await this.scanBarcode(
          { type: 2, barcode_number: goldItems?.liquidity_barcode },
          db_name,
          i18n,
        );
      }
      let new_liquidity_barcode_url;
      if (new_liquidity_barcode) {
        new_liquidity_barcode_url = `${process.env.NEST_PUBLIC_S3_URL}${loan?.customer?.customer_id}/${loan?.liquidate_number}/liquidity_barcode_${loan?.liquidate_number}.png`;
        await this.updateBarcodeDetails(db_name, {
          type: 2,
          liquidity_id: loan?._id,
          new_barcode_url: new_liquidity_barcode_url,
          new_liquidity_barcode: barcodeData,
        });
      }
      return {
        liquidity_id: loan?._id,
        liquidity_number: loan?.liquidate_number,
        liquididty_barcode:
          liquidity_barcode?.barcode || barcodeDetails?.liquidity_barcode,
        liquididty_barcode_url:
          liquidity_barcode?.barcode_url ||
          barcodeDetails?.liquidity_barcode_url,
        new_liquidity_barcode,
        new_liquidity_barcode_url,
        customer: loan?.customer,
        gold_item_count: loan?.gold_items.length,
        gold_items: goldItems?.gold_items,
        created_date: liquidity_barcode?.created_date,
      };
    } else if (type == 1) {
      const barcodeDetails = await this.scanBarcode(
        { type: 1, barcode_number: barcode_number },
        db_name,
        i18n,
      );
      return barcodeDetails;
    } else {
      throw new BadRequestException('Invalid input.');
    }
  }

  async scanBarcode(
    assignBarcodeDTO: AssignBarcodeDTO,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.barcodeModel = setTanantConnection(
      db_name,
      BarcodeDetails.name,
      BarcodeDetailsSchema,
    );
    const { type } = assignBarcodeDTO;
    if (type == 3) {
      const container_barcode = await this.getBarcodeDetails(
        db_name,
        assignBarcodeDTO,
      );
      return {
        container_id: container_barcode?._id,
        container_number: container_barcode?.container_number,
        container_barcode: container_barcode?.barcode,
        container_barcode_url: container_barcode?.barcode_url,
        liquidity_count:
          (container_barcode?.container_liquidity_details).length,
        liquidity_details: container_barcode?.liquidity_details,
      };
    } else if (type == 2) {
      const container_barcode = await this.getBarcodeDetails(
        db_name,
        assignBarcodeDTO,
      );
      return {
        liquidity_id: container_barcode?.liquidity_id,
        liquidity_number: container_barcode?.liquidate_number,
        liquidity_barcode: container_barcode?.barcode,
        liquidity_barcode_url: container_barcode?.barcode_url,
        gold_piece_count: container_barcode.gold_items.length,
        gold_items: container_barcode.gold_items,
      };
    } else if (type == 1) {
      const container_barcode = await this.getBarcodeDetails(
        db_name,
        assignBarcodeDTO,
      );
      return {
        gold_piece_id: container_barcode?.gold_piece_id,
        gold_piece_name: container_barcode?.gold_piece_name,
        gold_piece_image_url: container_barcode?.gold_piece_image_url,
        gold_piece_barcode: container_barcode?.gold_piece_barcode,
        gold_piece_barcode_url: container_barcode?.gold_piece_barcode_url,
      };
    } else {
      throw new BadRequestException('Invalid');
    }
  }

  async disputeGenerate(
    disputeGenerateDTO: DisputeGenerateDTO,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.barcodeModel = setTanantConnection(
      db_name,
      BarcodeDetails.name,
      BarcodeDetailsSchema,
    );
    const { type, missing_id } = disputeGenerateDTO;
    console.log(missing_id);

    if (type == 3) {
      const liquidityBarcodeDetails = await this.getBarcodeDetails(
        db_name,
        disputeGenerateDTO,
      );
      await this.barcodeModel.updateMany(
        {
          liquidity_id: {
            $in: missing_id.map(
              (item) => new mongoose.Types.ObjectId(item?.['liquidity_id']),
            ),
          },
          type: 2,
        },
        {
          $set: { status: 4 },
        },
      );

      await Promise.all(
        missing_id.map(async (item) => {
          const liquidity = liquidityBarcodeDetails.liquidity_details.find(
            (liquidity) => liquidity.liquidity_id == item?.['liquidity_id'],
          );
          console.log(liquidity);

          const uniqueKey = await this.generateUniqueKey();
          const note_number = `DN${uniqueKey}`;
          this.createDebitCreditNotes(
            {
              liquidity_id: item?.['liquidity_id'],
              customer_id: liquidity?.customer_id,
              branch_id: liquidity?.branch_id,
              note_type: 1,
              note_number,
              contracted_value: liquidity?.gold_piece_value,
              actual_value: 0,
              difference_amount: liquidity?.gold_piece_value,
              container_id: liquidityBarcodeDetails?._id,
              remarks: disputeGenerateDTO?.remarks,
              authorized_by: user_id,
            },
            db_name,
          );
        }),
      );
      return liquidityBarcodeDetails;
    } else if (type == 2) {
      const liquidityBarcodeDetails = await this.getBarcodeDetails(
        db_name,
        disputeGenerateDTO,
      );
      await this.barcodeModel.updateMany(
        {
          gold_piece_id: {
            $in: missing_id.map(
              (item) => new mongoose.Types.ObjectId(item?.['gold_piece_id']),
            ),
          },
        },
        { $set: { status: 4 } },
      );

      const uniqueKey = await this.generateUniqueKey();
      const note_number = `DN${uniqueKey}`;
      console.log(note_number);

      const debit_credite_note = await this.createDebitCreditNotes(
        {
          liquidity_id: liquidityBarcodeDetails?.['liquidity_id'],
          customer_id: liquidityBarcodeDetails?.customer_id,
          branch_id: liquidityBarcodeDetails?.branch_id,
          note_type: 1,
          note_number,
          contracted_value: liquidityBarcodeDetails?.gold_piece_value,
          actual_value: 0,
          difference_amount: 0,
          container_id: liquidityBarcodeDetails?._id,
          remarks: disputeGenerateDTO?.remarks,
          authorized_by: user_id,
        },
        db_name,
      );
      const debit_credit_note_items = await Promise.all(
        missing_id.map(async (item) => {
          const gold_item = liquidityBarcodeDetails.gold_items.find(
            (liquidity) => liquidity.gold_piece_id == item?.['gold_piece_id'],
          );
          const karatage_price_per_gram =
            await this.goldLoanService.calculateKaratagePricePerGram(
              gold_item?.gold_purity_entered_per_1000,
              liquidityBarcodeDetails?.gold_price_24_karate,
            );
          const gold_piece_value =
            await this.goldLoanService.calculateGoldPieceValue(
              karatage_price_per_gram,
              gold_item?.gold_weight,
            );
          console.log(gold_piece_value);

          const missing_item_dispute = this.createDebitCreditNoteItems(
            {
              gold_piece_id: gold_item?.gold_piece_id,
              note_id: debit_credite_note?.['_id'],
              contracted_weight: gold_item?.gold_weight,
              actual_weight: 0,
              contracted_purity: gold_item?.gold_purity_entered_per_1000,
              actual_purity: 0,
              gold_price_24_karate:
                liquidityBarcodeDetails?.gold_price_24_karate,
              gold_piece_value: gold_piece_value,
            },
            db_name,
          );
          return missing_item_dispute;
        }),
      );
      const actual_amount = debit_credit_note_items.reduce(
        (acc, item) => acc + item.gold_piece_value,
        0,
      );
      const updatedMissingLiquidity = await this.updateCreditDebitNote(
        debit_credite_note?.['_id'],
        actual_amount,
        liquidityBarcodeDetails?.gold_piece_value - actual_amount,
        db_name,
      );
      return updatedMissingLiquidity;
    } else {
      throw new BadRequestException('Invalid input.');
    }
  }

  async createDebitCreditNotes(
    CreateDebitCreditNotesDTO: CreateDebitCreditNotesDTO,
    db_name: string,
  ): Promise<any> {
    console.log(CreateDebitCreditNotesDTO);
    this.debitCreditNoteModel = setTanantConnection(
      db_name,
      DebitCreditNotes.name,
      DebitCreditNotesSchema,
    );
    const newDebitCreditNote = new this.debitCreditNoteModel({
      ...CreateDebitCreditNotesDTO,
      created_date: date_moment(),
    });

    try {
      await newDebitCreditNote.save();
    } catch (error) {
      throw new BadRequestException(error);
    }
    return newDebitCreditNote;
  }

  async updateCreditDebitNote(
    id: string,
    actual_amount: number,
    difference_amount: number,
    db_name: string,
  ): Promise<any> {
    console.log(id, actual_amount, difference_amount);

    this.debitCreditNoteModel = setTanantConnection(
      db_name,
      DebitCreditNotes.name,
      DebitCreditNotesSchema,
    );
    const updatedNote = await this.debitCreditNoteModel.findOneAndUpdate(
      { _id: id },
      {
        actual_value: actual_amount,
        difference_amount: difference_amount,
      },
      { new: true },
    );
    return updatedNote;
  }

  async createDebitCreditNoteItems(
    createDebitCreditNoteItemDTO: CreateDebitCreditNoteItemDTO,
    db_name: string,
  ): Promise<any> {
    console.log(createDebitCreditNoteItemDTO);

    this.debitCreditNoteItemsModel = setTanantConnection(
      db_name,
      DebitCreditNoteItems.name,
      DebitCreditNoteItemsSchema,
    );
    const newDebitCreditNote = new this.debitCreditNoteItemsModel({
      ...createDebitCreditNoteItemDTO,
      created_date: date_moment(),
    });

    try {
      await newDebitCreditNote.save();
    } catch (error) {
      throw new BadRequestException(error);
    }
    return newDebitCreditNote;
  }

  async verifyGoldPieces(
    verifyGoldItem: VerifyGoldItem,
    user_id: string,
    db_name: string,
    i18n: I18nContext,
  ): Promise<any> {
    this.barcodeModel = setTanantConnection(
      db_name,
      BarcodeDetails.name,
      BarcodeDetailsSchema,
    );
    this.debitCreditNoteModel = setTanantConnection(
      db_name,
      DebitCreditNotes.name,
      DebitCreditNotesSchema,
    );
    this.debitCreditNoteItemsModel = setTanantConnection(
      db_name,
      DebitCreditNoteItems.name,
      DebitCreditNoteItemsSchema,
    );
    const item_barcode = await this.getBarcodeDetails(db_name, {
      type: 1,
      barcode_number: verifyGoldItem?.gold_piece_barcode,
    });
    if (item_barcode?.status !== 1) {
      await this.debitCreditNoteModel.findOneAndDelete({
        liquidity_id: item_barcode?.liquidity_id,
      });
      await this.debitCreditNoteItemsModel.findOneAndDelete({
        gold_piece_id: item_barcode?.gold_piece_id,
      });
    }

    if (
      item_barcode?.gold_piece_weight === verifyGoldItem?.gold_piece_weight &&
      item_barcode?.gold_piece_purity === verifyGoldItem?.gold_piece_purity
    ) {
      const updateResult = await this.barcodeModel.findOneAndUpdate(
        {
          barcode: item_barcode?.gold_piece_barcode,
          type: 1,
        },
        {
          $set: {
            status: 2,
            specification: verifyGoldItem?.gold_piece_specification,
          },
        },
        { returnOriginal: false },
      );
      return {
        gold_piece_id: updateResult?.gold_piece_id,
        gold_piece_name: item_barcode?.gold_piece_name,
        gold_piece_image_url: item_barcode?.gold_piece_image_url,
        gold_piece_barcode: updateResult?.barcode,
        gold_piece_barcode_url: updateResult?.barcode_url,
        status: updateResult?.status,
        liquidate_number: item_barcode?.liquidate_number,
        customer_id: item_barcode?.customer_id,
      };
    } else {
      await this.barcodeModel.findOneAndUpdate(
        {
          barcode: verifyGoldItem?.gold_piece_barcode,
          type: 1,
        },
        {
          $set: { status: 3 },
        },
      );
      const uniqueKey = await this.generateUniqueKey();
      const note_number = `DN${uniqueKey}`;
      const findContainerNumber = await this.barcodeModel
        .findOne({ liquidity_id: item_barcode?.['liquidity_id'], type: 2 })
        .exec();
      const container_id = await this.barcodeModel
        .findOne({
          container_number: findContainerNumber?.['container_number'],
          type: 3,
        })
        .exec();

      let debit_credit_note;
      const existing_note = await this.debitCreditNoteModel.findOne({
        liquidity_id: item_barcode?.['liquidity_id'],
      });
      if (existing_note) {
        debit_credit_note = existing_note;
      } else {
        debit_credit_note = await this.createDebitCreditNotes(
          {
            liquidity_id: item_barcode?.['liquidity_id'],
            customer_id: item_barcode?.customer_id,
            branch_id: item_barcode?.branch_id,
            note_type: 1,
            note_number,
            contracted_value: item_barcode?.gold_piece_value,
            actual_value: 0,
            difference_amount: 0,
            container_id: container_id?.id,
            remarks: verifyGoldItem?.gold_piece_specification,
            authorized_by: user_id,
          },
          db_name,
        );
      }
      const old_karatage_price_per_gram =
        await this.goldLoanService.calculateKaratagePricePerGram(
          item_barcode?.gold_piece_purity,
          item_barcode?.gold_price_24_karate,
        );
      const old_gold_piece_value =
        await this.goldLoanService.calculateGoldPieceValue(
          old_karatage_price_per_gram,
          item_barcode?.gold_piece_weight,
        );

      const new_karatage_price_per_gram =
        await this.goldLoanService.calculateKaratagePricePerGram(
          verifyGoldItem?.gold_piece_purity,
          item_barcode?.gold_price_24_karate,
        );
      const new_gold_piece_value =
        await this.goldLoanService.calculateGoldPieceValue(
          new_karatage_price_per_gram,
          verifyGoldItem?.gold_piece_weight,
        );
      console.log(new_gold_piece_value);

      await this.createDebitCreditNoteItems(
        {
          gold_piece_id: item_barcode?.gold_piece_id,
          note_id: debit_credit_note?.['_id'],
          contracted_weight: item_barcode?.gold_piece_weight,
          actual_weight: verifyGoldItem?.gold_piece_weight,
          contracted_purity: item_barcode?.gold_piece_purity,
          actual_purity: verifyGoldItem?.gold_piece_purity,
          gold_price_24_karate: item_barcode?.gold_price_24_karate,
          gold_piece_value: new_gold_piece_value,
        },
        db_name,
      );

      const dispute_items = await this.debitCreditNoteItemsModel
        .find({ note_id: debit_credit_note?._id })
        .exec();
      let actual_amount = debit_credit_note?.actual_amount || 0;
      let item_difference = 0;
      const promises = dispute_items.map(async (item) => {
        const old_karatage_price_per_gram =
          await this.goldLoanService.calculateKaratagePricePerGram(
            item?.contracted_purity,
            item?.gold_price_24_karate,
          );
        const old_gold_piece_value =
          await this.goldLoanService.calculateGoldPieceValue(
            old_karatage_price_per_gram,
            item?.contracted_weight,
          );

        const new_karatage_price_per_gram =
          await this.goldLoanService.calculateKaratagePricePerGram(
            item?.actual_purity,
            item?.gold_price_24_karate,
          );
        const new_gold_piece_value =
          await this.goldLoanService.calculateGoldPieceValue(
            new_karatage_price_per_gram,
            item?.actual_weight,
          );

        return old_gold_piece_value - new_gold_piece_value;
      });

      const results = await Promise.all(promises);
      item_difference = results.reduce((acc, current) => acc + current, 0);

      actual_amount =
        actual_amount == 0
          ? item_barcode?.gold_piece_value - item_difference
          : actual_amount - item_difference;

      await this.updateCreditDebitNote(
        debit_credit_note?.['_id'],
        actual_amount,
        item_difference,
        db_name,
      );
      return item_barcode;
    }
  }

  async geGoldValuationReport(
    db_name,
    i18n: I18nContext,
    liquidate_number: string,
  ): Promise<any> {
    this.barcodeModel = setTanantConnection(
      db_name,
      BarcodeDetails.name,
      BarcodeDetailsSchema,
    );
    const loan = await this.getLoanDetails(liquidate_number, '', db_name, i18n);
    const liquidity_barcode = await this.barcodeModel
      .findOne({
        liquidity_id: loan?._id,
        type: 2,
      })
      .exec();

    if (liquidity_barcode) {
      loan.liquidity_barcode = liquidity_barcode.barcode;
    }
    loan.gold_items = await Promise.all(
      loan.gold_items.map(async (gold_item, i) => {
        const gold_item_barcode = await this.barcodeModel
          .findOne({
            liquidity_id: loan?._id,
            gold_piece_id: gold_item.gold_item_id,
            type: 1,
          })
          .exec();

        if (gold_item_barcode) {
          (gold_item.gold_item_barcode = gold_item_barcode.barcode),
            (gold_item.status = gold_item_barcode?.status);
          gold_item.specification = gold_item_barcode?.specification || '';
        }

        return gold_item;
      }),
    );
    return {
      liquidity_id: loan?.loan_id,
      liquidity_number: loan?.liquidate_number,
      liquidity_barcode: loan?.liquidity_barcode,
      gold_item_count: (loan?.gold_items).length,
      gold_items: loan?.gold_items,
    };
  }
}

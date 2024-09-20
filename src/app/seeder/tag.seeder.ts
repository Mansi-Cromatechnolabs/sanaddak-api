import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { bcryptPassword } from 'src/utils/helper';
import { TagService } from '../gold_loan/tag.service';
import { CreateTagDTO } from '../gold_loan/dto/tag.dto';
import { Tag, TagSchema } from '../gold_loan/schema/tag.schema';
import { setTanantConnection } from 'src/utils/mongo-tanant-connection.util';
import { date_moment } from 'src/utils/date.util';

@Injectable()
export class TagSeeder {
  tagModel: import("mongoose").Model<any, unknown, unknown, {}, any, any>;
  constructor(private readonly tagService: TagService, private readonly userService: UserService) {}
 
  async addTag(
    createTagDTO: CreateTagDTO,
    user_id: string,
    db_name: string,
  ): Promise<Tag | any> {
    this.tagModel = setTanantConnection(db_name, Tag.name, TagSchema);
    const existingConfig = await this.tagModel
      .findOne({ name: createTagDTO.name, delete_date: null, is_active: true })
      .exec();
      if (existingConfig) {
          return false
      }
    if (!existingConfig && !createTagDTO.tag_id) {
      createTagDTO.created_by = user_id;
      createTagDTO.create_date = date_moment();
      createTagDTO.is_active = true;
      createTagDTO.is_default=true;
      const newConfig = new this.tagModel(createTagDTO);
      await newConfig.save();
      return newConfig;
    } else if (existingConfig && !createTagDTO.tag_id) {
      return false
    } else {
      const tag = await this.tagModel
        .findOne({
          _id: createTagDTO.tag_id,
          name: createTagDTO.name,
          is_active: true,
        })
        .exec();
      if (tag) {
        createTagDTO.updated_by = user_id;
        createTagDTO.update_date = date_moment();
        const updateTag = await this.tagModel.findOneAndUpdate(
          { _id: createTagDTO.tag_id },
          { $set: createTagDTO },
          { new: true },
        );
        return updateTag;
      } else if (!tag && !existingConfig) {
        createTagDTO.updated_by = user_id;
        createTagDTO.update_date = date_moment();
        const updateTag = await this.tagModel.findOneAndUpdate(
          { _id: createTagDTO.tag_id },
          { $set: createTagDTO },
          { new: true },
        );
        return updateTag;
      } else {
        return false
      }
    }
  }

  async seed(db_name: string) {
    const tag = await this.tagService.getTagByName("Egypt",db_name);
    if(tag){
      return;
    }
    let user = await this.userService.findTanantUserByEmail(db_name, process.env.DEFAULT_STAFF_EMAIL_4_SEEDER);
    await this.addTag({
          "name": "Egypt",
          description: 'default tag for every'
      } as CreateTagDTO, user?.id, db_name)
  }
}

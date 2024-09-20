import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { bcryptPassword } from 'src/utils/helper';

@Injectable()
export class UserSeeder {
  constructor(private readonly userService: UserService) {}

  async seed(data?: any) {
    let admin = await this.userService.findMasterUserByEmail('super_admin@sanaddak1.com');
    if (!admin) {
      const data = await this.userService.createAdminUser(
        'Moataman',
        'Daader',
        'super_admin@sanaddak1.com',
        '9876543210',
        await bcryptPassword('Password@123'),
      );
      const data2 = await this.userService.createTanantDbAndUser({
        franchise: process.env.DEFAULT_FRANCHISE
      });
      return data;
    }
  }

  async tenantSeed(dbname:string)
  {
    const data2 = await this.userService.createTanantUser(dbname,{
      franchise: process.env.DEFAULT_FRANCHISE,
      first_name: 'Rajiv',
      last_name: 'Prasad',
      country_code: '+91',
      email: process.env.DEFAULT_STAFF_EMAIL_4_SEEDER,
      mobile_number: '1234567890',
      password: 'Password@123',
      not_deletable: true,
      is_admin: true,
      is_active: true,
      store_id: null,
      agent_code:null
    });
    return data2;
  }
}

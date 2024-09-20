import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class StoreRegisterDTO {
  @ApiProperty({ description: 'Enter store name', example: 'xyz' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Enter store address', example: 'xyzwasdadf' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Enter store is never delete',
    example: 'true/false',
  })
  @IsNotEmpty()
  @IsOptional()
  is_never_delete: boolean;

  @ApiProperty({
    description: 'Enter store location',
    example: `{ "country": "India", "region": "Gujarat", "city": "Ahmedabad", "latitude": 23.0367641, "longitude": 72.5111531 }`,
  })
  @IsNotEmpty()
  @IsObject()
  location: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  };

  @IsOptional()
  @IsString()
  branch_owner_id: string;

  @IsOptional()
  registration_date: Date;

  @ApiProperty({
    description: 'Enter branch days avaibility',
    example: `[
        {
                "day": "monday",
                "is_open": true,
                "slots": [
                    {
                        "start_time": "01:00 PM",
                        "end_time": "02:00 PM",
                        "max_attendee": 1,
                        "is_active": true
                    },
                    {
                        "start_time": "02:00 PM",
                        "end_time": "03:00 PM",
                        "max_attendee": 1
                    }]
        }
    ]`,
  })
  @IsOptional()
  days_avaibility: [
    {
      day: string;
      is_open: boolean;
      slots: { start_time: string; end_time: string; max_attendee: number }[];
    },
  ];

  @ApiProperty({
    description: 'Enter branch holiday details',
    example: `[
        {
            "name": "Independance day",
            "holiday_date": "2024-08-15T12:50:01.660Z"
        }
    ]`,
  })
  @IsOptional()
  holiday_details: [
    {
      name: string;
      holiday_date: Date;
    },
  ];

  @ApiProperty({
    description: 'Enter store owner details',
    example: ` {
            "id": "66aa0978714ffd117a2cc88a",
            "first_name": "Rahul",
            "last_name": "Panchal",
            "email": "panchalrahul133@gmail.com",
            "country_code": "+91",
            "phone": "8000326510"
        }
`,
  })
  @IsNotEmpty()
  store_owner_details: {
    first_name: string;
    last_name: string;
    email: string;
    country_code: string;
    phone: string;
  };

  @IsOptional()
  branch_key: string
}

export class StoreUpdateDTO {
  @ApiProperty({
    description: 'Enter store id',
    example: '6696625d8ce4bd58355302ac',
  })
  @IsNotEmpty()
  @IsString()
  store_id: string;

  @ApiProperty({ description: 'Enter store name', example: 'xyz' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Enter store address', example: 'xyzwasdadf' })
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Enter store location', example: 'xyz' })
  @IsOptional()
  @IsObject()
  location: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}

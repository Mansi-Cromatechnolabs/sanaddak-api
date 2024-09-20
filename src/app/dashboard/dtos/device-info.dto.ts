import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNotEmpty, IsObject, IsNumber, IsDate } from 'class-validator';
import { DeviceOs } from 'src/utils/enums.util';

export class DeviceLocationDTO {
  @ApiProperty({
    description: 'Country of the device location',
    example: 'United States',
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'Region of the device location',
    example: 'California',
  })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty({
    description: 'City of the device location',
    example: 'San Francisco',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Latitude of the device location',
    example: 37.7749,
  })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    description: 'Longitude of the device location',
    example: -122.4194,
  })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;
}

export class DeviceDTO {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: '60d5f779a8c0f7d0c65d229f',
    type: String,
  })
  @IsOptional()
  @IsString()
  user_id?: string | null;

  @ApiProperty({
    description: 'Unique identifier for the device',
    example: 'device1234',
  })
  @IsString()
  @IsNotEmpty()
  device_id: string;

  @ApiProperty({
    description: 'Name of the device',
    example: 'iPhone 12',
  })
  @IsString()
  @IsNotEmpty()
  device_name: string;

  @ApiProperty({
    description: 'Operating system of the device',
    example: DeviceOs.IOS,
    enum: DeviceOs, // Ensure DeviceOs enum is defined in your project
  })
  @IsEnum(DeviceOs)
  @IsNotEmpty()
  os: DeviceOs;

  @ApiProperty({
    description: 'Version of the operating system',
    example: '14.4',
  })
  @IsString()
  @IsNotEmpty()
  os_version: string;

  @ApiProperty({
    description: 'IP address of the device',
    example: '192.168.1.1',
  })
  @IsString()
  @IsNotEmpty()
  ip_address: string;

  @ApiProperty({
    description: 'Location details of the device',
    type: DeviceLocationDTO,
  })
  @IsObject()
  @IsNotEmpty()
  location: DeviceLocationDTO;
}

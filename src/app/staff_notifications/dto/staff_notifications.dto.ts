import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StaffNotificationDTO {
  @ApiProperty({
    description: 'Enter store id',
    example: '66a344c0167351c3f1aaf67c',
  })
  @IsOptional()
  store_id: string;

  @ApiProperty({
    description: 'Enter staff id',
    example: '66a344c0167351c3f1aaf67c',
  })
  @IsOptional()
  staff_id: string;

  @ApiProperty({
    description: 'Enter notification type',
    example: '1/2/3/4',
  })
  @IsNotEmpty()
  notification_type: number;

  @ApiProperty({
    description: 'Enter notification message',
    example: 'hjshds',
  })
  @IsNotEmpty()
  message: string;

  @IsOptional()
  created_date: Date;

  @IsOptional()
  created_by: string;
}

export class GetStaffNotificationDTO {
  @ApiProperty({
    description: 'Enter notification id',
    example: '66b0e9ce12c02aab74244f24',
  })
  @IsOptional()
  @IsString()
  notification_id: string;
}

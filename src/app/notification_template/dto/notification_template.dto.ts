import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetNotificationTemplateDto {
  @ApiProperty({
    example: '669771674f30029d1e8e4f0f',
    description: 'enter notification template id',
  })
  @IsOptional()
  @IsString()
  notification_template_id: string;

  @ApiProperty({
    example: 'message/notification',
    description: 'enter notification type',
  })
  @IsNotEmpty()
  @IsString()
  notification_type: string;
}

export class UpdateNotificationTemplateDTO {
  @ApiProperty({
    example: '669771674f30029d1e8e4f0f',
    description: 'enter notification template id',
  })
  @IsNotEmpty()
  notification_template_id: string;
  
  @ApiProperty({
    description: 'enter notification name',
    example: 'notification name',
  })
  @IsOptional()
  name: string;

  @ApiProperty({
    description: 'enter notification body',
    example: 'html content',
  })
  @IsOptional()
  message: string;

  @ApiProperty({
    example: 'message/notification',
    description: 'enter notification type',
  })
  @IsOptional()
  @IsString()
  notification_type: string;

  @IsOptional()
  updated_by: string;
}

export class AddNotificationTemplateDTO {

  @ApiProperty({
    description: 'enter notification key',
    example: 'notification key',
  })
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'enter notification name',
    example: 'notification name',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'message/notification',
    description: 'enter notification type',
  })
  @IsNotEmpty()
  @IsString()
  notification_type: string;

  @ApiProperty({ description: 'enter notification message', example: '' })
  @IsNotEmpty()
  message: string;

  @IsOptional()
  created_by: string;

  @IsOptional()
  created_date: Date;
}

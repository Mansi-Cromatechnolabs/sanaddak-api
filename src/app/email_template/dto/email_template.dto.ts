import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetEmailTemplateDto {
  @ApiProperty({
    example: '669771674f30029d1e8e4f0f',
    description: 'enter email template id',
  })
  @IsOptional()
  @IsString()
  email_template_id: string;
}

export class UpdateEmailTemplateDTO {
  @ApiProperty({
    example: '669771674f30029d1e8e4f0f',
    description: 'enter email template id',
  })
  @IsNotEmpty()
  email_template_id: string;

  @ApiProperty({
    description: 'enter email name',
    example: 'email name',
  })
  @IsOptional()
  name: string;

  @ApiProperty({
    description: 'enter email cc',
    example: ['cc1@mail.com', 'cc2@mail.com'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  cc: string[];

  @ApiProperty({
    description: 'enter email bcc',
    example: ['bcc1@mail.com', 'bcc2@mail.com'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  bcc: string[];

  @ApiProperty({ description: 'enter email body', example: 'hrml content' })
  @IsOptional()
  body: string;

  @ApiProperty({ description: 'enter email from', example:'' })
  @IsOptional()
  from: string;

  @ApiProperty({ description: 'enter email subject', example: '' })
  @IsOptional()
  subject: string;

  @IsOptional()
  updated_by: string;
}
export class AddEmailTemplateDTO {
  @ApiProperty({
    description: 'enter email name',
    example: 'email name',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'enter email from', example: 'example@mail.com' })
  @IsOptional()
  from: string;

  @ApiProperty({
    description: 'enter email cc',
    example: ['cc1@mail.com', 'cc2@mail.com'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  cc: string[];

  @ApiProperty({
    description: 'enter email bcc',
    example: ['bcc1@mail.com', 'bcc2@mail.com'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  bcc: string[];

  @ApiProperty({ description: 'enter email subject', example: 'Email Subject' })
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'enter email body',
    example: 'HTML content',
  })
  @IsNotEmpty()
  body: string;

  @IsOptional()
  created_by: string;

  @IsOptional()
  created_date: Date;
}

export class EmailTemplateDto {
  @ApiProperty({
    example: '669771674f30029d1e8e4f0f',
    description: 'enter email name',
  })
  name: string;
}
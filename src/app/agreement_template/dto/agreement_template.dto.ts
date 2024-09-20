import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetAgreementTemplateDto {
  @ApiProperty({
    example: '669771674f30029d1e8e4f0f',
    description: 'enter agreement template customer id',
  })
  @IsNotEmpty()
  @IsString()
  loan_id: string;

  @ApiProperty({
    example: '1',
    description: 'enter agreement template customer id',
  })
  @IsNotEmpty()
  @IsNumber()
  agreement_type: number;
}

export class UpdateAgreementTemplateDTO {
  @ApiProperty({
    example: '669771674f30029d1e8e4f0f',
    description: 'enter agreement template id',
  })
  @IsNotEmpty()
  agreement_template_id: string;

  @ApiProperty({
    description: 'enter aggrement name',
    example: 'aggrement name',
  })
  @IsOptional()
  name: string;

  @ApiProperty({
    description: 'enter aggrement priority',
    example: 'priority number',
  })
  @IsOptional()
  priority: number;

  @ApiProperty({ description: 'enter aggrement body', example: 'hrml content' })
  @IsOptional()
  body: string;

  @ApiProperty({ description: 'enter aggrement type', example: '1' })
  @IsNotEmpty()
  @IsNumber()
  agreement_type: number;

  @IsOptional()
  updated_by: string;
}

export class AddAgreementTemplateDTO {
  @ApiProperty({
    description: 'enter aggrement name',
    example: 'aggrement name',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'enter aggrement priority',
    example: 'priority number',
  })
  @IsNotEmpty()
  priority: number;

  @ApiProperty({ description: 'enter aggrement body', example: 'hrml content' })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiProperty({ description: 'enter aggrement type', example: '1' })
  @IsNotEmpty()
  @IsString()
  agreement_type: number;

  @IsOptional()
  created_by: string;

  @IsOptional()
  updated_by: string;

  @IsOptional()
  created_date: Date;
}

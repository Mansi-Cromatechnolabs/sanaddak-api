import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApplicationStatusDTO {
  @ApiProperty({
    example: 'adsf4tr456rgedt5g54',
    description: 'enter loan id',
  })
  @IsOptional()
  @IsString()
  loan_id: string;

  @ApiProperty({
    example: 'adsf4tr456rgedt5g54',
    description: 'enter valuation id',
  })
  @IsOptional()
  @IsString()
  valuation_id: string;

  @ApiProperty({ example: '1', description: 'enter application status' })
  @IsNotEmpty()
  application_status: number;

  @ApiProperty({
    example: 'Not ready for application...',
    description: 'enter reason for rejection',
  })
  @IsOptional()
  reason_for_rejection: string;

  @IsOptional()
  status_update_date: Date;
}

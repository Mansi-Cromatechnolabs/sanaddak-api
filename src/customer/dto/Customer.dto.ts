import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CustomerDto {
  @IsOptional()
  @ApiProperty({ description: 'Enter field type', example: 'email/phone' })
  search_key: string;
}

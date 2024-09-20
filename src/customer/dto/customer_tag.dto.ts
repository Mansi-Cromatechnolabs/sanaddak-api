import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomertagDTO {
  @ApiProperty({
    example: 'cwe4ty54gy54e656757rg54',
    description: 'enter customer tag id',
  })
  @IsOptional()
  customer_tag_id: string;

  @ApiProperty({
    example: 'cwe4ty54gy54e656757rg54',
    description: 'enter tag id',
  })
  @IsNotEmpty()
  @IsString()
  tag_id: string;

  @ApiProperty({
    example: 'cwe4ty54gy54e656757rg54',
    description: 'enter customer id',
  })
  @IsNotEmpty()
  @IsString()
  customer_id: string;

  @ApiProperty({ example: '1', description: 'enter priority' })
  @IsNotEmpty()
  @IsString()
  priority: number;

  @IsOptional()
  create_date: Date;

  @IsOptional()
  update_date: Date;
}

export class CustomerTagDTO {
  @ApiProperty({
    example: 'cwe4ty54gy54e656757rg54',
    description: 'enter customer id',
  })
  @IsNotEmpty()
  @IsString()
  customer_id: string;
}

export class DeleteCustomerTagDTO {

  @ApiProperty({
    example: 'cwe4ty54gy54e656757rg54',
    description: 'enter tag id',
  })
  @IsNotEmpty()
  @IsString()
  tag_id: string;

  @ApiProperty({
    example: 'cwe4ty54gy54e656757rg54',
    description: 'enter customer id',
  })
  @IsNotEmpty()
  @IsString()
  customer__id: string;
}

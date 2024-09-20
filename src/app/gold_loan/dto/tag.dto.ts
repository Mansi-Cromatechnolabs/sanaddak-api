import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTagDTO {
  @ApiProperty({
    description: 'enter tag id',
    example: 'd33r4f56tgfhggj67ygdfd',
  })
  @IsOptional()
  tag_id: string;

  @ApiProperty({ description: 'enter margin rate', example: 'tag name' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'enter description', example: 'tag description' })
  @IsOptional()
  description: string;

  @IsOptional()
  is_active: boolean;

  @IsOptional()
  created_by: string;

  @IsOptional()
  updated_by: string;

  @IsOptional()
  create_date: Date;

  @IsOptional()
  update_date: Date;

  @IsOptional()
  is_default: boolean;
}

export class TagDTO {
  @ApiProperty({
    description: 'enter tag id',
    example: 'd33r4f56tgfhggj67ygdfd',
  })
  @IsNotEmpty()
  tag_id: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

class UpdateContactDetailsDto {
  @ApiProperty({ example: 'hello@gmail.com', description: 'email id' })
  email: string;

  @ApiProperty({ example: '+91 65489464668', description: 'mobile number' })
  mobile_number: string;
}

export class deleteContactDetailsDto {
  @ApiProperty({ example: '669771674f30029d1e8e4f0f', description: 'store id' })
  store_id: string;

  @ApiProperty({
    example: '669771674f30029d1e8e4f0f',
    description: 'details id',
  })
  _id: string;

  @ApiProperty({
    example: { email: 'hello@gmail.com', mobile_number: '+91 65489464668' },
    description: 'details id',
  })
  data: UpdateContactDetailsDto;
}

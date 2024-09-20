import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SignedAgreementDTO {
  @ApiProperty({
    description: 'Type of the agreement',
    example: 'Sale Agreement',
  })
  @IsOptional()
  @IsString()
  agreement_type: string;

  @ApiProperty({
    description: 'URL of the agreement document',
    example: 'https://www.example.com/agreement.pdf',
  })
  @IsOptional()
  @IsString()
  agreement_url: string;

  @ApiProperty({
    description: 'Date when the agreement was created',
    example: '2024-08-30T00:00:00.000Z',
  })
  @IsOptional()
  created_date: Date;
}

export class UpdateLoanDTO {
  @ApiProperty({
    description: 'Enter loan id',
    example: 'ad23rfgngyjy5ygdfg6tged',
  })
  @IsNotEmpty()
  @IsString()
  loan_id: string;

  @ApiProperty({
    description: 'Enter verification status',
    example: 'true|false',
  })
  @IsOptional()
  is_verified?: boolean;

  @ApiProperty({
    description: 'Enter verifier id',
    example: 'ad23rfgngyjy5ygdfg6tged',
  })
  @IsOptional()
  verifier_id?: string;

  @ApiProperty({
    description: 'Enter verification office id',
    example: 'ad23rfgngyjy5ygdfg6tged',
  })
  @IsOptional()
  verification_office_id?: string;

  @ApiProperty({
    description: 'Enter signed agreements',
    type: [SignedAgreementDTO],
    example: [
      {
        agreement_type: 'Agreement',
        agreement_url: 'https://www.example.com/agreement.pdf',
        created_date: '2024-08-30T00:00:00.000Z',
      },
    ],
  })
  @IsOptional()
  signed_agreements?: SignedAgreementDTO[]; 

  @IsOptional()
  unsigned_agreements?: string

  @IsOptional()
  fullfillment_agreement?:string

  @IsOptional()
  liquidate_agreement?:string

  @ApiProperty({
    description: 'Enter signed agreements',
    type: SignedAgreementDTO,
    example: [
      {
        agreement_type: 'Agreement',
        agreement_url: 'https://www.example.com/agreement.pdf',
        created_date: '2024-08-30T00:00:00.000Z',
      },
    ],
  })
  @IsOptional()
  signed_fullfillment_agreement?: SignedAgreementDTO;

  @ApiProperty({
    description: 'Enter signed agreements',
    type: SignedAgreementDTO,
    example: [
      {
        agreement_type: 'Agreement',
        agreement_url: 'https://www.example.com/agreement.pdf',
        created_date: '2024-08-30T00:00:00.000Z',
      },
    ],
  })
  @IsOptional()
  signed_liquidate_agreement?: SignedAgreementDTO;

  @IsOptional()
  loan_status?: string
}

export class GetLoanDTO {
  @ApiProperty({
    description: 'Enter loan id',
    example: 'ad23rfgngyjy5ygdfg6tged',
  })
  @IsNotEmpty()
  @IsString()
  loan_id: string;
}

export class UpdateLoanStatus {
  @ApiProperty({
    description: 'Enter loan id',
    example: 'ad23rfgngyjy5ygdfg6tged',
  })
  @IsNotEmpty()
  @IsString()
  loan_id: string;

  @ApiProperty({
    description: 'Enter liquidatae status',
    example: 'Extend|Buyback|Liquidate',
  })
  @IsOptional()
  @IsString()
  loan_status: string;

  @ApiProperty({
    description: 'Enter liquidate status',
    example: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  })
  @IsOptional()
  liquidate_date: Date;

  @ApiProperty({
    description: 'Enter extended status',
    example: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  })
  @IsOptional()
  extended_date: Date;
}

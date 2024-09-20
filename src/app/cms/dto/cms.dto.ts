import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumberString, IsOptional, IsString, Length, Matches } from 'class-validator';

export class AddCmsDTO {

    @ApiProperty({ description: 'Enter user page type', example: 'faq/privacy/tnc/aboutus/appointmnet_tnc/kyc_tnc' })
    @IsNotEmpty()
    @IsString()
    page_type: string;

    @ApiProperty({ description: 'Enter user page content', example: '' })
    @IsNotEmpty()
    @IsString()
    page_content: string;

    @ApiProperty({ description: 'Enter user page content', example: '' })
    @IsOptional()
    created_by: string;
}

export class GetCmsDTO {

    @ApiProperty({
    description: 'Enter user page type', example: 'faq/privacy/tnc/aboutus/appointmnet_tnc/kyc_tnc'})
    @IsNotEmpty()
    @IsString()
    page_type: string;
}

export class UpdateCmsDTO {

    @IsNotEmpty()
    @ApiProperty({
        example: '669771674f30029d1e8e4f0f',
        description: 'cms id',
    })
    _id: string;

    @ApiProperty({ description: 'Enter user page type', example: 'faq/privacy/tnc/aboutus' })
    @IsNotEmpty()
    @IsString()
    page_type: string;

    @ApiProperty({ description: 'Enter user page content', example: '' })
    @IsNotEmpty()
    @IsString()
    page_content: string;
}

export class DeleteCmsDTO {

    @IsNotEmpty()
    @ApiProperty({
        example: '669771674f30029d1e8e4f0f',
        description: 'cms id',
    })
    _id: string;
}

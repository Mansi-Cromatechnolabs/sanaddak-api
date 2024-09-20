import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CustomerInsightDTO {

    @ApiProperty({
        example: 'cwe4ty54gy54e656757rg54',
        description: 'enter customer insight id',
    })
    @IsOptional()
    @IsString()
    customer_insight_id: string;

    @ApiProperty({
        example: 'cwe4ty54gy54e656757rg54',
        description: 'enter customer id',
    })
    @IsOptional()
    @IsString()
    customer_id: string;
    
    @ApiProperty({
        example: `{
        "father_name": "",
        "mother_name": "",
        "marital_status": "",
        "spouse_name":"",
        "number_of_children":""
    }`, description: 'enter family details' })
    @IsOptional()
    @IsObject()
    family_details: {
        father_name: string;
        mother_name: string;
        marital_status: string;
        spouse_name: string;
        number_of_children: number;
    };

    @ApiProperty({
        example: `{
        "current_job_title": "",
        "employer_name": "",
        "employement_start_date": "",
        "monthly_income":""
    }`, description: 'enter occupation details' })
    @IsOptional()
    @IsObject()
    occupation_details: {
        current_job_title: string;
        employer_name: string;
        employement_start_date: Date;
        monthly_income: string;
    };

    @ApiProperty({
        example: `{
        "facebook_handel": "",
        "x_handel": ""
    }`, description: 'enter social media details' })
    @IsOptional()
    @IsObject()
    social_media_details: {
        facebook_handel: string;
        x_handel: string;
    };

    @ApiProperty({
        example: `{
        "name": "",
        "phone": ""
    }`, description: 'enter emergency contact details' })
    @IsOptional()
    @IsObject()
    emergency_contact_details: {
        name: string;
        phone: string;
    };

    @IsOptional()
    create_date: Date;

    @IsOptional()
    update_date: Date;
}

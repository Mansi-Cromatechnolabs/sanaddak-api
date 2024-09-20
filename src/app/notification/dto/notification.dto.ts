import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumberString, IsOptional, IsString, Length, Matches } from 'class-validator';



export class GetCustomerNotificationDTO {
    @ApiProperty({
    description: 'Enter notification id', example: '66b0e9ce12c02aab74244f24'})
    @IsOptional()
    @IsString()
    notification_id: string;
}


export class CustomerNotificationDTO {


    @ApiProperty({
        description: 'Enter notification type', example: '1/2/3/4'
    })
    @IsNotEmpty()
    notification_type: number;

    @ApiProperty({
        description: 'Enter notification message', example: 'hjshds'
    })
    @IsNotEmpty()
    message: string;

    @IsOptional()
    created_date: Date;
    

}

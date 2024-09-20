import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class PushNotificationEnableDto {
    @ApiProperty({ description: 'Enter field is notification enable', example: 'true/false' })
    @IsBoolean()
    @IsNotEmpty()
    is_notification_enable: boolean;
}

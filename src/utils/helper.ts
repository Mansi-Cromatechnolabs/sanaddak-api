import { IsEnum, IsNumberString, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ENCRYPT_DECRYPT } from 'src/config/constant.config';
import * as bcrypt from 'bcrypt';
import { SortOrder } from './enums.util';
export const requestContext = new Map<string, any>();

export class PaginateDto {
    @ApiProperty({ required: false, type: Number, example: 1 })
    @IsOptional()
    @ValidateIf((v) => v.page !== '')
    @IsNumberString()
    page: number;

    @ApiProperty({ required: false, type: Number, example: 10 })
    @IsOptional()
    @ValidateIf((v) => v.limit !== '')
    @IsNumberString()
    limit: number;

    @ApiProperty({ required: false, type: String, example: '' })
    @IsOptional()
    @IsString()
    search: string;

    @ApiProperty({ required: false, enum: SortOrder })
    @IsOptional()
    @ValidateIf((v) => v.order_by_value !== '')
    @IsEnum(SortOrder)
    sort_order: SortOrder;
}

export async function bcryptPassword(text: string) {
    return await bcrypt.hash(text, 10)
}

export async function bcryptComparePassword(old_password, new_password) {
    return await bcrypt.compare(old_password, new_password)
}

export function encrypt(text: string): string {
    const cipher = crypto.createCipheriv(ENCRYPT_DECRYPT.ALGORITHM, ENCRYPT_DECRYPT.key, ENCRYPT_DECRYPT.BINARY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

export function decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipheriv(ENCRYPT_DECRYPT.ALGORITHM, ENCRYPT_DECRYPT.key, ENCRYPT_DECRYPT.BINARY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Convert string boolean to boolean type
@Injectable()
export class ParseBoolFieldsPipe implements PipeTransform<any, any> {
    transform(value: any, metadata: ArgumentMetadata): any {
        for (const key in value) {
            if (typeof value[key] === 'string' && (value[key].toLowerCase() === 'true' || value[key].toLowerCase() === 'false')) {
                value[key] = value[key].toLowerCase() === 'true';
            }
        }
        return value;
    }
}

export function generateRandomString(length = 8) {
    return Array.from({ length }, () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return chars.charAt(Math.floor(Math.random() * chars.length));
    }).join('');
}

export async function setTanantDbName(value) {
    requestContext.set('tdbname', value);
}

export async function getTanantDbName() {
    return requestContext.get('tdbname');
}

export function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
}

export function replacePlaceholders(message: string, placeholders: Record<string, string>): string {
    if (!placeholders || Object.keys(placeholders).length === 0) {
        return message; // Return original message if no placeholders are provided
    }

    return message.replace(/{{(.*?)}}/g, (_, key) => {
        return placeholders[key.trim()] || ''; // Replace with empty string if the placeholder is not found
    });
}


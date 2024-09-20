import { HttpException } from "@nestjs/common";
import { _500 } from "./http-code.util";

export function successResponse(status:number=200,message: string = '', data: any = [], meta: any = null) {
    return {
        status:status,
        success: true,
        data,
        meta,
        message
    };
}

export function errorResponse(error) {
    let { message, status = _500, response } = error;
    throw new HttpException({ status: status, success: false, message: message, data: response.data?response.data:{} }, status);
}

export class SuccessResponseDTO {
    success: boolean;
    data: any;
    meta: any;
    message: string
}

export class ErrorResponseDto {
    success: boolean;
    message: string;
    error?: Error | string
}

export type PromiseResponse = Promise<ErrorResponseDto | SuccessResponseDTO>;
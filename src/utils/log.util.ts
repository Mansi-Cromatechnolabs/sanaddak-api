import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class LogUtil {
    private readonly logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger({
            transports: [
                new DailyRotateFile({
                    level: 'info',
                    filename: 'logs/%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                }),
                new winston.transports.Console({
                    level: 'debug',
                }),
            ],
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf((info) => {
                    const { timestamp, level, message, ...meta } = info;
                    let logMessage = `${timestamp} [${level}]: ${message}`;
                    if (Object.keys(meta).length) {
                        logMessage += `\n${JSON.stringify(meta, null, 2)}`;
                    }
                    return logMessage;
                }),
            ),
        });
    }

    log(message: string, meta?: Record<string, any>) {
        this.logger.log('info', message, meta);
    }

    error(message: string, meta?: Record<string, any>) {
        this.logger.error(message, meta);
    }

    warn(message: string, meta?: Record<string, any>) {
        this.logger.warn(message, meta);
    }

    debug(message: string, meta?: Record<string, any>) {
        this.logger.debug(message, meta);
    }
}

export function infoLog(message: string, meta?: Record<string, any>) {
    const logger = new LogUtil();
    logger.log(message, meta);
}

export function errorLog(message: string, meta?: Record<string, any>) {
    const logger = new LogUtil();
    logger.error(message, meta);
}

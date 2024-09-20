import { ValidationError } from 'class-validator';
import { BadRequestException, ValidationPipeOptions } from '@nestjs/common';

export const validationPipeOptions: ValidationPipeOptions = {
    exceptionFactory: (errors: ValidationError[]) => {
        const messages = {};
        errors.forEach((item) => {
            let errorMessages = Object.values(item.constraints);
            messages[item.property] = errorMessages[errorMessages.length - 1];
        });

        return new BadRequestException(messages);
    },
};

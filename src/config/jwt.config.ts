import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import { JWT_TOKEN_EXPIRATION_TIME } from './constant.config';
dotenv.config();

export const jwtConfig = JwtModule.register({
    global: true,
    secret: process.env.SECRET_KEY,
    signOptions: { expiresIn: JWT_TOKEN_EXPIRATION_TIME },
});

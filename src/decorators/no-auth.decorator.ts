import { SetMetadata } from '@nestjs/common';
import { NO_AUTH_REQUIRED } from 'src/config/constant.config';

export const NoAuthRequire = () => SetMetadata(NO_AUTH_REQUIRED, true);

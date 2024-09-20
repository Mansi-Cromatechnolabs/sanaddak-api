import { ConfigModuleOptions } from '@nestjs/config';
import { APP_CONFIG_CONSTANT as APP_CONFIG } from "./constant.config";

export const appConfig: ConfigModuleOptions = {
    isGlobal: APP_CONFIG.GLOBAL,
    envFilePath: APP_CONFIG.ENV_FILE_PATH,
};

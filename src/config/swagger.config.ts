import { DocumentBuilder } from '@nestjs/swagger';
import { SWAGGER_CONFIG_CONSTANT as SWAGGER_CONFIG } from 'src/config/constant.config';


export const swaggerConfig = new DocumentBuilder()
    .setTitle(SWAGGER_CONFIG.TITLE)
    .setDescription(SWAGGER_CONFIG.DESCRIPTION)
    .setVersion(SWAGGER_CONFIG.VERSION)
    .addBearerAuth()
    .build();

export const swaggerOptions = {
    swaggerOptions: {
        tagsSorter: SWAGGER_CONFIG.TAGS_SORTER,
        docExpansion: SWAGGER_CONFIG.DOC_EXPANSION,
    },
};
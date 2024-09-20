import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as express from 'express';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig, swaggerOptions } from './config/swagger.config';
import { MAIN_CONSTANT } from './config/constant.config';
import { ValidationPipe } from '@nestjs/common';
import { validationPipeOptions } from './utils/validation.util';
import { useContainer } from 'class-validator';
import * as admin from 'firebase-admin';
import * as path from 'path';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.enableCors();
  app.setGlobalPrefix(MAIN_CONSTANT.GLOB_PREFIX);
  app.use(express.static(MAIN_CONSTANT.STATIC_FOLDER));
  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
  const document = SwaggerModule.createDocument(app, swaggerConfig); // Use swaggerConfig

  SwaggerModule.setup(
    MAIN_CONSTANT.OPEN_API_PATH,
    app,
    document,
    swaggerOptions,
  );

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  admin.initializeApp({
    credential: admin.credential.cert(
      path.resolve(__dirname, '../src/config/firebase-adminsdk.json'),
    ),
  });

  await app.listen(process.env.APP_PORT);
}
bootstrap();

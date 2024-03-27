import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getValidationPipe } from './validation';
import './array';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(getValidationPipe());
  app.enableCors({ origin: '*' });

  const config = new DocumentBuilder()
    .setTitle('EtuUTT - API')
    .setDescription(
      "The API that allows to interact with the database of the student site to see, edit and delete some data according to the user's access.",
    )
    .setVersion('1')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('', app, document);

  await app.listen(3000);
}

bootstrap();

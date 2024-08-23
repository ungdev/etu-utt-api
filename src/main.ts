import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppValidationPipe } from './app.pipe';
import './array';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix(process.env.API_PREFIX);
  // This env variable is not set in ConfigModule because we use it before modules are loaded
  app.useGlobalPipes(new AppValidationPipe());
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
  sortSchemasAlphabetically(document); // Not possible using only configurations.
  SwaggerModule.setup(`${process.env.API_PREFIX}docs`, app, document, {
    jsonDocumentUrl: 'docs/json',
    yamlDocumentUrl: 'docs/yaml',
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(3000);
}

// ChatGPT in combination with https://stackoverflow.com/questions/62473023/how-to-sort-the-schemas-on-swagger-ui-springdoc-open-ui#answer-62585730
function sortSchemasAlphabetically(document: OpenAPIObject) {
  if (document.components && document.components.schemas) {
    const sortedSchemas = new Map(
      Object.entries(document.components.schemas).sort(([a], [b]) => {
        const aIsError = a.startsWith('AppErrorResDto$');
        const bIsError = b.startsWith('AppErrorResDto$');
        if (aIsError && !bIsError) return 1;
        if (!aIsError && bIsError) return -1;
        return a.localeCompare(b);
      }),
    );
    document.components.schemas = Object.fromEntries(sortedSchemas);
  }
}

bootstrap();

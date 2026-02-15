import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { LoggingInterceptor } from '../common';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'debug', 'error', 'fatal', 'verbose', 'warn'],
  });

  app.use(cookieParser());

  // TODO: Replace 'origin: true' with an explicit whitelist of allowed origins
  // e.g. origin: configService.get('CORS_ORIGIN')?.split(',') || ['http://localhost:5173']
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const logger = new Logger(bootstrap.name);
  const host = process.env.HOST ?? '0.0.0.0';
  const port = process.env.PORT ?? 3000;

  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Chess Game Monolith API')
      .setDescription('The Chess Game Monolith API description')
      .setVersion('1.0')
      .addTag('chess-game-monolith')
      .addCookieAuth('accessToken')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document, {
      jsonDocumentUrl: 'swagger/json',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(
      `Swagger available at http://${host}:${port}/swagger`,
    );
  }

  await app.listen(port, host, () => {
    logger.log(`Server running on http://${host}:${port}`);
  });
}
bootstrap();

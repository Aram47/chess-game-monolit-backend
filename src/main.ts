import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { LoggingInterceptor } from '../common';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      credentials: true,
    },
    logger: ['log', 'debug', 'error', 'fatal', 'verbose', 'warn'],
  });

  app.use(cookieParser());
  app.useGlobalInterceptors(new LoggingInterceptor());
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     transform: true,
  //   }),
  // );

  const logger = new Logger(bootstrap.name);

  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Chess Game Monolith API')
      .setDescription('The Chess Game Monolith API description')
      .setVersion('1.0')
      .addTag('chess-game-monolith')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document, {
      jsonDocumentUrl: 'swagger/json',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(
      `Swagger available at http://localhost:${process.env.PORT ?? 3000}/swagger`,
    );
  }
  await app.listen(process.env.PORT ?? 3000, () => {
    logger.log(`PORT: ${process.env.PORT}`);
  });
}
bootstrap();

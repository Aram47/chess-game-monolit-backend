import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

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
    console.log(
      `Swagger available at http://localhost:${process.env.PORT ?? 3000}/swagger`,
    );
  }
  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(`PORT: ${process.env.PORT}`);
  });
}
bootstrap();

import { Module } from '@nestjs/common';
import { CommonModule } from '../common';
import { ConfigModule } from '@nestjs/config';
import { ApiGatewayModule } from './api-gateway/api-gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    CommonModule,
    ApiGatewayModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

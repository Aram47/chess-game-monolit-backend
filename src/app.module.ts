import { Module } from '@nestjs/common';
import { ApiGatewayModule } from './api-gateway/api-gateway.module';

@Module({
  imports: [ApiGatewayModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

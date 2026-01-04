import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { ApiGatewayService } from './api-gateway.service';
import { ApiGatewayController } from './api-gateway.controller';
import { GameServiceModule } from '../game-service/game-service.module';
import { SnapshotServiceModule } from '../snapshot-service/snapshot-service.module';
import { OwnerServiceModule } from '../owner-service/owner-service.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    GameServiceModule,
    OwnerServiceModule,
    SnapshotServiceModule,
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}

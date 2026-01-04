import { Module } from '@nestjs/common';
import { OwnerServiceService } from './owner-service.service';
import { OwnerServiceController } from './owner-service.controller';
import { GameServiceModule } from '../game-service/game-service.module';

@Module({
  imports: [GameServiceModule],
  controllers: [OwnerServiceController],
  providers: [OwnerServiceService],
  exports: [OwnerServiceService],
})
export class OwnerServiceModule {}

import { Module } from '@nestjs/common';
import { OwnerServiceService } from './owner-service.service';
import { OwnerServiceController } from './owner-service.controller';

@Module({
  controllers: [OwnerServiceController],
  providers: [OwnerServiceService],
  exports: [OwnerServiceService],
})
export class OwnerServiceModule {}

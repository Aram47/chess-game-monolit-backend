import { Module } from '@nestjs/common';
import { SocketServiceService } from './socket-service.service';
import { SocketServiceGateway } from './socket-service.gateway';
import { SnapshotServiceModule } from '../snapshot-service/snapshot-service.module';

@Module({
  imports: [SnapshotServiceModule],
  providers: [SocketServiceGateway, SocketServiceService],
})
export class SocketServiceModule {}

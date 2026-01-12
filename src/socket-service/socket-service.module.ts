import { Module } from '@nestjs/common';
import { SocketServiceService } from './socket-service.service';
import { SocketServiceGateway } from './socket-service.gateway';
import { SnapshotServiceModule } from '../snapshot-service/snapshot-service.module';
import { SocketServiceServicee } from './socket-service.service';

@Module({
  imports: [SnapshotServiceModule],
  providers: [
    SocketServiceGateway,
    SocketServiceService,
    SocketServiceServicee,
  ],
})
export class SocketServiceModule {}

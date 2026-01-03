import { Module } from '@nestjs/common';
import {
  ENV_VARIABLES,
  ProblemSnapshot,
  ProblemSnapshotSchema,
} from '../../common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SnapshotServiceService } from './snapshot-service.service';
import { SnapshotServiceController } from './snapshot-service.controller';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: `mongodb://${configService.get<string>(ENV_VARIABLES.MONGO_HOST)}:${configService.get<string>(ENV_VARIABLES.MONGO_PORT)}/${configService.get<string>(ENV_VARIABLES.MONGO_DB_NAME)}`,
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),
    MongooseModule.forFeature([
      { name: ProblemSnapshot.name, schema: ProblemSnapshotSchema },
    ]),
  ],
  controllers: [SnapshotServiceController],
  providers: [SnapshotServiceService],
  exports: [SnapshotServiceService],
})
export class SnapshotServiceModule {}

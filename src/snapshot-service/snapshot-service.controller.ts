import { Controller } from '@nestjs/common';
import { SnapshotServiceService } from './snapshot-service.service';

@Controller('snapshot-service')
export class SnapshotServiceController {
  constructor(
    private readonly snapshotServiceService: SnapshotServiceService,
  ) {}
}

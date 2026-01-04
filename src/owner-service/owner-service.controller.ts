import { AuthGuard } from '../../common';
import { Controller, UseGuards } from '@nestjs/common';
import { OwnerServiceService } from './owner-service.service';

@UseGuards(AuthGuard)
@Controller('owner-service')
export class OwnerServiceController {
  constructor(private readonly ownerServiceService: OwnerServiceService) {}
}

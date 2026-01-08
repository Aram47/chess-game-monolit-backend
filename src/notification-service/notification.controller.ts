import { Observable } from 'rxjs';
import { SseEvent, AuthGuard } from '../../common';
import { Sse, UseGuards, Controller } from '@nestjs/common';
import { NotificationsService } from './notification.service';

@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse()
  stream(): Observable<SseEvent> {
    return this.notificationsService.getStream();
  }
}

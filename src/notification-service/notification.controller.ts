import { Observable } from 'rxjs';
import { Request } from 'express';
import {
  SseEvent,
  AuthGuard,
  UserDecorator,
  UserDecoratorDto,
} from '../../common';
import { NotificationsService } from './notification.service';
import { Req, Sse, UseGuards, Controller } from '@nestjs/common';

@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  stream(
    @Req() req: Request,
    @UserDecorator() userMetaData: UserDecoratorDto,
  ): Observable<SseEvent> {
    const userId = userMetaData.sub;

    return new Observable((observer) => {
      const subject = this.notificationsService.addConnection(userId);

      const sub = subject.subscribe(observer);

      // HEARTBEAT
      const heartbeat = setInterval(() => {
        subject.next({
          event: 'ping',
          data: Date.now(),
        });
      }, 25_000);

      let closed = false;

      req.on('close', () => {
        if (closed) return;

        closed = true;

        clearInterval(heartbeat);
        this.notificationsService.removeConnection(userId, subject);
        sub.unsubscribe();
      });
    });
  }
}

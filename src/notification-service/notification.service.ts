import { SseEvent } from '../../common';
import { Subject, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly events = new Subject<SseEvent>();

  getStream(): Observable<SseEvent> {
    return this.events.asObservable();
  }

  emit(event: SseEvent) {
    this.events.next({
      data: event.data,
      event: event?.event,
      id: event?.id,
      retry: event?.retry,
    });
  }
}

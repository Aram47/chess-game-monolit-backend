import { Subject } from 'rxjs';
import { SseEvent } from '../../common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly streams = new Map<number, Set<Subject<SseEvent>>>();

  addConnection(userId: number): Subject<SseEvent> {
    const subject = new Subject<SseEvent>();

    if (!this.streams.has(userId)) {
      this.streams.set(userId, new Set());
    }

    this.streams.get(userId)!.add(subject);

    return subject;
  }

  removeConnection(userId: number, subject: Subject<SseEvent>) {
    const userStreams = this.streams.get(userId);

    if (!userStreams) return;

    subject.complete();
    userStreams.delete(subject);

    if (userStreams.size === 0) {
      this.streams.delete(userId);
    }
  }

  pushToUser(userId: number, event: SseEvent) {
    this.streams.get(userId)?.forEach((subject) => {
      subject.next(event);
    });
  }
}

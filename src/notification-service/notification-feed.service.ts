import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InboxNotification } from '../../common';
import { INBOX_NOTIFICATION_SKIP_EVENTS } from './notification-inbox-skip.constants';

export interface InboxNotificationRowDto {
  id: number;
  eventType: string;
  data: unknown;
  readAt: string | null;
  createdAt: string;
}

@Injectable()
export class NotificationFeedService {
  private readonly logger = new Logger(NotificationFeedService.name);

  constructor(
    @InjectRepository(InboxNotification)
    private readonly repo: Repository<InboxNotification>,
  ) {}

  async persist(userId: number, eventType: string, data: unknown): Promise<void> {
    if (INBOX_NOTIFICATION_SKIP_EVENTS.has(eventType)) {
      return;
    }

    try {
      const row = this.repo.create({
        userId,
        eventType,
        payload:
          data !== undefined && data !== null && typeof data === 'object'
            ? (data as Record<string, unknown>)
            : { value: data },
        readAt: null,
      });
      await this.repo.save(row);
    } catch (err) {
      this.logger.warn(
        `Failed to persist inbox notification userId=${userId} event="${eventType}"`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  async listForUser(
    userId: number,
    options?: { limit?: number; unreadOnly?: boolean },
  ): Promise<InboxNotificationRowDto[]> {
    const limit = Math.min(100, Math.max(1, options?.limit ?? 50));
    const qb = this.repo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC')
      .take(limit);

    if (options?.unreadOnly) {
      qb.andWhere('n.readAt IS NULL');
    }

    const rows = await qb.getMany();
    return rows.map((r) => ({
      id: r.id,
      eventType: r.eventType,
      data: r.payload,
      readAt: r.readAt ? r.readAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async markRead(userId: number, id: number): Promise<void> {
    const res = await this.repo.update({ id, userId }, { readAt: new Date() });
    if (!res.affected) {
      throw new NotFoundException('Notification not found');
    }
  }

  async markAllRead(userId: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(InboxNotification)
      .set({ readAt: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('readAt IS NULL')
      .execute();
  }
}

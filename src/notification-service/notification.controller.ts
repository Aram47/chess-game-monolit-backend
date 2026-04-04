import { Observable } from 'rxjs';
import { Request } from 'express';
import {
  SseEvent,
  AuthGuard,
  UserDecorator,
  UserDecoratorDto,
} from '../../common';
import { NotificationsService } from './notification.service';
import { NotificationFeedService } from './notification-feed.service';
import {
  Req,
  Sse,
  Get,
  Post,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Controller,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('notifications')
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationFeedService: NotificationFeedService,
  ) {}

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
          type: 'ping',
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

  @Get('inbox')
  @ApiOperation({ summary: 'List persisted notifications (missed when offline)' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listInbox(
    @UserDecorator() userMetaData: UserDecoratorDto,
    @Query('unreadOnly') unreadOnlyRaw?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const unreadOnly = unreadOnlyRaw === 'true' || unreadOnlyRaw === '1';
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    return this.notificationFeedService.listForUser(userMetaData.sub, {
      limit: Number.isFinite(limit) ? limit : undefined,
      unreadOnly,
    });
  }

  @Patch('inbox/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark one inbox notification as read' })
  async markInboxRead(
    @UserDecorator() userMetaData: UserDecoratorDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.notificationFeedService.markRead(userMetaData.sub, id);
  }

  @Post('inbox/read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all inbox notifications as read' })
  async markInboxAllRead(@UserDecorator() userMetaData: UserDecoratorDto): Promise<void> {
    await this.notificationFeedService.markAllRead(userMetaData.sub);
  }
}

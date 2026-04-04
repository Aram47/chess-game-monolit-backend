# Notification Service Module

## Overview

The Notification Service module provides real-time notifications to users using Server-Sent Events (SSE). It manages user connections, broadcasts notifications via Redis pub/sub, and maintains active SSE streams for each connected user.

## Purpose

The Notification Service module:
- Provides real-time notifications via Server-Sent Events (SSE)
- Manages user connection lifecycle
- Integrates with Redis for distributed notifications
- Persists selected events to Postgres (`InboxNotifications`) so users can fetch missed alerts after login
- Supports multiple concurrent connections per user
- Implements heartbeat mechanism for connection health

## Architecture

The module consists of:
- **NotificationsController**: SSE stream + REST inbox (`GET/PATCH/POST …/inbox…`)
- **NotificationsService**: Connection and event management
- **NotificationsRedisSubscriber**: Redis pub/sub integration (subscribes to `NOTIFICATIONS_USER_CHANNEL`)
- **NotificationsPublisherService**: Persists to inbox (except skip-list), then publishes to Redis
- **NotificationFeedService**: TypeORM access to `InboxNotification` rows
- **notification.constants.ts**: `NOTIFICATIONS_USER_CHANNEL` (`notifications:user`) and `UserNotificationEvents` (SSE event name constants)
- **notification-inbox-skip.constants.ts**: Events not stored in inbox (e.g. `friend.request.received` / `friend.request.sent` — use `GET /user-service/friends/pending` instead)
- **NotificationsModule**: Imports `RedisModule` + `TypeOrmModule.forFeature([InboxNotification])`

### Dependencies

- **Redis**: For pub/sub message distribution
- **PostgreSQL / TypeORM**: Inbox persistence (`InboxNotifications` table)
- **RxJS**: For reactive event streams (Subject, Observable)
- **Express**: For SSE endpoint handling

### PostgreSQL table (ERD)

The **`InboxNotifications`** table stores per-recipient notification rows for events that should survive an offline period (see [Database ERDs](./11-erd-databases.md) §1 for the full PostgreSQL diagram, column list, indexes, and relationship to `Users`). Entity class: `InboxNotification` (`common/models/postgres_entity/inbox-notification.entity.ts`). Registered in `AppModule` TypeORM `entities` and in `NotificationsModule` via `TypeOrmModule.forFeature`.

---

## Core Functionality

### Server-Sent Events (SSE)

The service implements SSE for real-time notifications:

**SSE Characteristics:**
- Unidirectional communication (server to client)
- Automatic reconnection support
- Built-in event types
- HTTP-based (works through firewalls/proxies)

**Connection Flow:**
1. Client connects to `/notifications/stream` endpoint
2. Server creates RxJS Subject for user
3. Subject is subscribed to SSE stream
4. Heartbeat keeps connection alive
5. Notifications are pushed to Subject
6. Connection cleanup on disconnect

---

### Connection Management

The `NotificationsService` manages user connections:

**Connection Storage:**
- Uses `Map<userId, Set<Subject<SseEvent>>>` for connection tracking
- Each user can have multiple concurrent connections
- Each connection has its own Subject

**Connection Lifecycle:**
1. **Add Connection**: Creates Subject and adds to user's connection set
2. **Remove Connection**: Completes Subject and removes from set
3. **Push Notification**: Broadcasts to all user's connections

---

### Redis Integration

The `NotificationsRedisSubscriber` integrates with Redis pub/sub:

**Redis Channel:**
- Channel name: `notifications:user` (see `NOTIFICATIONS_USER_CHANNEL` in `notification.constants.ts`)
- Subscribes on module initialization
- Listens for published messages

**Message Format:**
```typescript
{
  userId: number;
  event: string;        // Event type (e.g., 'order.created')
  data: any;            // Event payload
  id?: string;          // Optional event ID
  retry?: number;       // Optional retry interval
}
```

**Publishing Notifications:**
- **Preferred:** inject `NotificationsPublisherService` and call `publishToUser(userId, event, data)` so the channel name and JSON shape stay consistent.
- **Low-level:** any service with the Redis client can `PUBLISH` to `NOTIFICATIONS_USER_CHANNEL`:
```typescript
await redis.publish(
  NOTIFICATIONS_USER_CHANNEL,
  JSON.stringify({
    userId: 123,
    event: 'game.invitation',
    data: { gameId: 'abc123', opponent: 'user456' }
  })
);
```

**Built-in social events (from `UserFriendService`):**
- `friend.request.received` — **recipient**. `data`: `{ friendship: FriendshipRowDto }`.
- `friend.request.sent` — **requester** (same create/reopen pending). `data`: `{ friendship: FriendshipRowDto }`.
- `friend.request.accepted` — **both** participants after accept. `data`: `{ friendship: FriendshipRowDto }` for each viewer.
- `friend.request.rejected` — **requester** after recipient rejects. `data`: `{ friendshipId: number }`.
- `friend.request.cancelled` — **recipient** after requester cancels pending. `data`: `{ friendshipId: number }`.
- `friend.removed` — the **other** user after someone unfriends (accepted row removed). `data`: `{ friendshipId: number }`.

---

### Heartbeat Mechanism

The service implements a heartbeat to keep connections alive:

**Heartbeat Details:**
- Interval: 25 seconds
- Event type: `ping`
- Data: Current timestamp
- Purpose: Prevents connection timeout

**Why 25 seconds:**
- Many proxies/load balancers timeout after 30 seconds
- 25-second interval ensures connection stays alive
- Provides connection health indication

---

## API Endpoints

### GET `/notifications/inbox`
Returns persisted notifications for the current user (events that occurred while offline or with no SSE connection).

**Query:** `unreadOnly` (optional, `true`/`1`), `limit` (optional, default 50, max 100).

**Response:** `Array<{ id, eventType, data, readAt, createdAt }>` (`readAt` / `createdAt` ISO strings).

### PATCH `/notifications/inbox/:id/read`
Marks one row read. **204** No Content.

### POST `/notifications/inbox/read-all`
Marks all unread rows read for the user. **204** No Content.

---

### GET `/notifications/stream`
Establishes SSE connection for real-time notifications.

**Authentication:** Required (AuthGuard)

**Response:**
- **Content-Type:** `text/event-stream`
- **Connection:** `keep-alive`
- **Stream:** Continuous SSE events

**Event Types:**
- `ping`: Heartbeat event (every 25 seconds)
- Custom events: Published via Redis

**Event Format:**
```
event: {eventType}
data: {JSON data}
id: {optional id}
retry: {optional retry ms}
```

**Example Events:**
```
event: ping
data: 1699123456789

event: game.invitation
data: {"gameId":"abc123","opponent":"user456"}

event: problem.solved
data: {"problemId":42,"score":100}

event: friend.request.received
data: {"friendship":{"id":1,"status":"pending","requestedBy":2,"createdAt":"...","otherUser":{"id":2,"username":"alice",...}}}

event: friend.request.accepted
data: {"friendship":{"id":1,"status":"accepted",...}}
```

---

## Service Methods

### NotificationsService Methods

#### `addConnection(userId: number): Subject<SseEvent>`
Adds a new SSE connection for a user.

**Parameters:**
- `userId`: User ID (number)

**Returns:**
- RxJS Subject for the connection

**Flow:**
1. Creates new Subject
2. Adds to user's connection set
3. Returns Subject for subscription

---

#### `removeConnection(userId: number, subject: Subject<SseEvent>)`
Removes a connection and cleans up.

**Parameters:**
- `userId`: User ID (number)
- `subject`: Subject to remove

**Flow:**
1. Completes the Subject
2. Removes from user's connection set
3. Cleans up empty sets

---

#### `pushToUser(userId: number, event: SseEvent)`
Pushes notification to all user's connections.

**Parameters:**
- `userId`: User ID (number)
- `event`: SSE event object

**Flow:**
1. Retrieves user's connection set
2. Iterates through all Subjects
3. Pushes event to each connection

---

### NotificationsRedisSubscriber Methods

#### `onModuleInit()`
Initializes Redis subscription.

**Flow:**
1. Creates Redis subscriber client (duplicate)
2. Subscribes to `NOTIFICATIONS_USER_CHANNEL` (`notifications:user`)
3. Sets up message handler
4. Parses and forwards messages to NotificationsService

---

### NotificationsPublisherService

#### `publishToUser(userId, event, data, options?)`
Publishes a JSON message to `NOTIFICATIONS_USER_CHANNEL`. The subscriber turns it into an `SseEvent` and calls `pushToUser`.

**Parameters:**
- `userId`: Recipient user id
- `event`: SSE event name (e.g. `UserNotificationEvents.FRIEND_REQUEST_RECEIVED`)
- `data`: Serializable payload (objects are `JSON.stringify`’d inside the Redis message)
- `options`: Optional `id` / `retry` for SSE

**Errors:** Redis failures are logged; they do not throw to callers (friend request / accept HTTP responses still succeed).

---

## Data Models

### SseEvent (Nest `MessageEvent`)
```typescript
{
  type: string;        // SSE event name (wired as `event:` in the stream)
  data: any;           // Event payload
  id?: string;         // Optional event ID
  retry?: number;      // Optional retry interval (ms)
}
```

---

## Connection Lifecycle

### Connection Establishment

1. Client sends GET request to `/notifications/stream`
2. AuthGuard validates JWT token
3. Controller extracts user ID from token
4. NotificationsService creates Subject
5. Subject is subscribed to SSE Observable
6. Heartbeat interval starts
7. Connection is established

### Notification Delivery

1. Service publishes to Redis channel
2. RedisSubscriber receives message
3. Message is parsed and validated
4. NotificationsService.pushToUser() is called
5. Event is pushed to all user's Subjects
6. SSE stream delivers event to client

### Connection Cleanup

1. Client disconnects (closes connection)
2. Request `close` event is triggered
3. Heartbeat interval is cleared
4. Subject is unsubscribed
5. Connection is removed from service
6. Subject is completed

---

## Integration Points

- **Redis**: Pub/sub for distributed notifications
- **AuthGuard**: User authentication and identification
- **Express**: SSE endpoint handling
- **RxJS**: Reactive event streams

## Use Cases

1. **Game Invitations**: Notify users of game invitations
2. **Problem Completion**: Notify users when problems are solved
3. **Achievement Unlocks**: Notify users of achievements
4. **System Announcements**: Broadcast system-wide messages
5. **Friend Requests**: Notify users of friend requests
6. **Tournament Updates**: Notify users of tournament events

## Publishing Notifications

Any service can publish notifications:

```typescript
// Example: In GameServiceService
await this.redisClient.publish(
  'notifications:user',
  JSON.stringify({
    userId: 123,
    event: 'game.started',
    data: {
      gameId: 'abc123',
      opponent: 'user456',
      color: 'white'
    }
  })
);
```

---

## Error Handling

### Connection Errors
- Connection failures are handled gracefully
- Subjects are cleaned up on errors
- Errors are logged for debugging

### Redis Errors
- Redis connection errors are caught and logged
- Invalid message format is ignored
- Missing userId is validated

### Message Parsing
- JSON parsing errors are caught
- Invalid messages are logged and ignored
- Service continues operating on errors

---

## Performance Considerations

1. **Connection Limits**: Each user can have multiple connections
2. **Memory Management**: Subjects are cleaned up on disconnect
3. **Redis Pub/Sub**: Efficient for distributed notifications
4. **Heartbeat Interval**: 25 seconds balances connection health and overhead

## Security Considerations

1. **Authentication**: All connections require valid JWT token
2. **User Isolation**: Users only receive their own notifications
3. **Input Validation**: Redis messages are validated before processing
4. **Connection Limits**: Consider implementing per-user connection limits

## Future Improvements

1. **Event Filtering**: Allow clients to subscribe to specific event types
2. **Notification History**: Store notifications for offline users
3. **Priority Levels**: Support priority-based notifications
4. **Delivery Guarantees**: Implement at-least-once delivery
5. **WebSocket Support**: Add WebSocket as alternative to SSE
6. **Push Notifications**: Integrate with mobile push services
7. **Notification Preferences**: User-configurable notification settings
8. **Rate Limiting**: Prevent notification spam
9. **Batching**: Batch multiple notifications for efficiency

## Troubleshooting

### Connections Not Receiving Notifications
- Verify Redis pub/sub is working
- Check user ID in published messages
- Verify connection is established
- Check heartbeat events are received

### High Memory Usage
- Monitor connection count per user
- Implement connection limits
- Ensure proper cleanup on disconnect

### Redis Connection Issues
- Verify Redis is running and accessible
- Check Redis configuration
- Monitor Redis connection logs

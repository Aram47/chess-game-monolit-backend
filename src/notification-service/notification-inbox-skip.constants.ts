/**
 * SSE event names that are **not** written to `InboxNotifications`.
 * Friend requests are loaded via `GET /user-service/friends/pending` after login.
 */
export const INBOX_NOTIFICATION_SKIP_EVENTS = new Set<string>([
  'friend.request.received',
  'friend.request.sent',
  'ping',
]);

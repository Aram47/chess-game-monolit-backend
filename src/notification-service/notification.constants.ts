/** Redis pub/sub channel consumed by `NotificationsRedisSubscriber`. */
export const NOTIFICATIONS_USER_CHANNEL = 'notifications:user' as const;

/** SSE `event` field names for user-targeted notifications. */
export const UserNotificationEvents = {
  FRIEND_REQUEST_RECEIVED: 'friend.request.received',
  FRIEND_REQUEST_SENT: 'friend.request.sent',
  FRIEND_REQUEST_ACCEPTED: 'friend.request.accepted',
  FRIEND_REQUEST_REJECTED: 'friend.request.rejected',
  FRIEND_REQUEST_CANCELLED: 'friend.request.cancelled',
  FRIEND_REMOVED: 'friend.removed',
} as const;

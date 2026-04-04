/** Matches Nest `MessageEvent` — the stream uses `type` for the SSE `event:` field. */
export interface SseEvent<T = any> {
  data: T;
  type?: string;
  id?: string;
  retry?: number;
}

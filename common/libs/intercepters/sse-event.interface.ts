export interface SseEvent<T = any> {
  data: T;
  event?: string;
  id?: string;
  retry?: number;
}

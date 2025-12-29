import { SortDir } from '../enums';

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  MIN_LIMIT: 10,
  MAX_LIMIT: 100,
  SORT_BY: 'id',
  SORT_DIR: 'DESC' as SortDir,
  ALLOWED_SORT_FIELDS: ['id', 'createdAt'],
} as const;

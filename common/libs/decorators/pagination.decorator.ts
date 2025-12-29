import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PaginationDto } from '../../dtos';
import { SortDir } from '../../enums';
import { PAGINATION_DEFAULTS } from '../../constants';

export const Pagination = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): PaginationDto => {
    const { query } = ctx.switchToHttp().getRequest();

    const page = Math.max(Number(query.page), PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      Math.max(Number(query.limit), PAGINATION_DEFAULTS.MIN_LIMIT),
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const sortDir: SortDir =
      query.sortDir === SortDir.ASC ? SortDir.ASC : SortDir.DESC;

    const sortBy =
      typeof query.sortBy === 'string' &&
      PAGINATION_DEFAULTS.ALLOWED_SORT_FIELDS.includes(query.sortBy)
        ? query.sortBy
        : PAGINATION_DEFAULTS.SORT_BY;

    return {
      page,
      limit,
      skip,
      sortBy,
      sortDir,
    };
  },
);

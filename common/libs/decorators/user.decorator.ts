import { UserDecoratorDto } from '../../dtos/user';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserDecorator = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UserDecoratorDto => {
    const { body } = ctx.switchToHttp().getRequest();

    return body?.user;
  },
);

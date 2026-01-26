import { UserDecoratorDto } from '../../dtos/user';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserDecorator = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UserDecoratorDto => {
    const request = ctx.switchToHttp().getRequest();
    
    // AuthGuard sets user on req.user (see auth.guard.ts line 65)
    return request.user;
  },
);

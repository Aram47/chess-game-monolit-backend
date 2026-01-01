import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserDecorator = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
		const { body } = ctx.switchToHttp().getRequest();

		
	},
);

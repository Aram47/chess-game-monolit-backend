import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
		const { body } = ctx.switchToHttp().getRequest();

		
	},
);

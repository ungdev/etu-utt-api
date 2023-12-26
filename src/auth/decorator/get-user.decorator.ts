import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/prisma/types';

export const GetUser = createParamDecorator(
  (data: keyof User, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);

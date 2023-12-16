import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IsPublic } from '../decorator/public.decorator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Observable } from 'rxjs';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (this.reflector.get(IsPublic, context.getHandler())) return true;
    return super.canActivate(context);
  }
}

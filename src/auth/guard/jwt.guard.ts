import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IsPublic } from '../decorator/public.decorator';
import { AppException, ERROR_CODE } from '../../../src/exceptions';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Observable, firstValueFrom } from 'rxjs';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    if (this.reflector.get(IsPublic, context.getHandler())) return true;
    try {
      const result = await super.canActivate(context);
      if (!result || (result instanceof Observable && !(await firstValueFrom(result)))) throw new Error();
      return true;
    } catch {
      throw new AppException(ERROR_CODE.NOT_LOGGED_IN);
    }
  }
}

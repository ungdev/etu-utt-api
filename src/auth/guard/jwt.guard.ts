import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IsPublic } from '../decorator/public.decorator';
import { AppException, ERROR_CODE } from '../../../src/exceptions';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    // If the route is public, serve the request directly
    if (this.reflector.get(IsPublic, context.getHandler())) return true;
    try {
      // Check whether the user is logged in
      const result = await super.canActivate(context);
      if (!result || (result instanceof Observable && !(await firstValueFrom(result)))) throw new Error();
      // The user is logged in, we can serve the request
      return true;
    } catch {
      // The user is not logged in, throw an logging error
      throw new AppException(ERROR_CODE.NOT_LOGGED_IN);
    }
  }
}

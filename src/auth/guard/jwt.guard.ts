import {ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IsPublic } from '../decorator/public.decorator';
import { AppException, ERROR_CODE } from '../../../src/exceptions';
import { Observable, firstValueFrom } from 'rxjs';
import {RequestAuthData} from "../interfaces/request-auth-data.interface";

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const applicationId = context.switchToHttp().getRequest().headers['x-application'];
    if (!applicationId) throw new AppException(ERROR_CODE.APPLICATION_HEADER_MISSING);
    // Check whether the user is logged in
    let loggedIn = true;
    try {
      await super.canActivate(context);
    } catch {
      loggedIn = false;
    }
    if (!loggedIn && !this.reflector.get(IsPublic, context.getHandler())) {
      throw new AppException(ERROR_CODE.NOT_LOGGED_IN);
    }
    // If the user is logged in, we verify that the application used is consistent with the given application in header
    if (loggedIn && request.user.applicationId !== applicationId) {
      throw new AppException(ERROR_CODE.INCONSISTENT_APPLICATION);
    }
    if (!loggedIn) {
      request.user = { applicationId, permissions: {} } satisfies RequestAuthData;
    }
    // We can serve the request
    return true;
  }
}

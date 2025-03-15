import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IsPublic } from '../decorator';
import { AppException, ERROR_CODE } from '../../exceptions';
import { RequestAuthData } from '../interfaces/request-auth-data.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector, private prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest() as { user: RequestAuthData };
    const applicationId = context.switchToHttp().getRequest().headers['x-application'];
    if (!applicationId) throw new AppException(ERROR_CODE.APPLICATION_HEADER_MISSING);
    const application = await this.prisma.apiApplication.findUnique({ where: { id: applicationId } });
    if (!application) {
      throw new AppException(ERROR_CODE.NO_SUCH_APPLICATION, applicationId);
    }
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
    if (loggedIn && request.user.application.id !== applicationId) {
      throw new AppException(ERROR_CODE.INCONSISTENT_APPLICATION);
    }
    if (!loggedIn) {
      request.user = { application, permissions: {} } satisfies RequestAuthData;
    }
    // We can serve the request
    return true;
  }
}

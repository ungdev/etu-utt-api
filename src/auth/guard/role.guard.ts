import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { findRequiredUserTypes } from '../decorator';
import { AppException, ERROR_CODE } from '../../exceptions';
import { RequestAuthData } from '../interfaces/request-auth-data.interface';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // Retrieve the set of userTypes needed to access the current route
    const requiredTypes = findRequiredUserTypes(this.reflector, context);
    // If there is no required userType, serve the route
    if (!requiredTypes || !requiredTypes.length) return true;
    const user = (context.switchToHttp().getRequest().user as RequestAuthData).user;
    // Check whether the user is logged in
    if (!user) throw new AppException(ERROR_CODE.NOT_LOGGED_IN);
    // If the user has one of the needed permissions, serve the request
    for (const requiredType of requiredTypes) if (user.userType === requiredType) return true;
    // The user has none of the required permissions, throw an error
    throw new AppException(ERROR_CODE.FORBIDDEN_INVALID_ROLE, requiredTypes.join(','));
  }
}

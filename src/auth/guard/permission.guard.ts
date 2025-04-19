import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { findRequiredApiPermissions } from '../decorator';
import { AppException, ERROR_CODE } from '../../exceptions';
import { RequestAuthData } from '../interfaces/request-auth-data.interface';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // Retrieve the set of permissions needed to access the current route
    const requiredPermissions = findRequiredApiPermissions(this.reflector, context);
    // If there is no required permission, serve the route
    if (!requiredPermissions || !requiredPermissions.length) return true;
    const permissions = (context.switchToHttp().getRequest().user as RequestAuthData)?.permissions;
    // Check whether the user is logged in
    if (!permissions) throw new AppException(ERROR_CODE.NOT_LOGGED_IN);
    // If the user doesn't have all the needed permissions, throw an error ; else, serve the request
    for (const requiredPermission of requiredPermissions)
      if (permissions.can(requiredPermission))
        throw new AppException(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, requiredPermission);
    return true;
  }
}

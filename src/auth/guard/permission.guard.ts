import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../prisma/types';
import { RequirePermission } from '../decorator';
import { AppException, ERROR_CODE } from '../../exceptions';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // Retrieve the set of permissions needed to access the current route
    const requiredPermissions = this.reflector.get(
      RequirePermission,
      context.getHandler(),
    );
    // If there is no required permission, serve the route
    if (!requiredPermissions || !requiredPermissions.length) return true;
    const user = context.switchToHttp().getRequest().user as User;
    // Check whether the user is logged in
    if (!user) throw new AppException(ERROR_CODE.NOT_LOGGED_IN);
    // If the user has one of the needed permissions, serve the request
    for (const requiredPermission of requiredPermissions)
      if (user.permissions.includes(requiredPermission)) return true;
    // The user has none of the required permissions, throw an error
    throw new AppException(
      ERROR_CODE.FORBIDDEN_NOT_ENOUGH_PERMISSIONS,
      requiredPermissions[0],
    );
  }
}

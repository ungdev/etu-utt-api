import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../users/interfaces/user.interface';
import { RequirePermission } from '../decorator';
import { AppException, ERROR_CODE } from '../../exceptions';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get(RequirePermission, context.getHandler());
    if (!requiredPermissions || !requiredPermissions.length) return true;
    const user = context.switchToHttp().getRequest().user as User;
    if (!user) throw new AppException(ERROR_CODE.NOT_LOGGED_IN);
    for (const requiredPermission of requiredPermissions)
      if (user.permissions.includes(requiredPermission)) return true;
    throw new AppException(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_PERMISSIONS, requiredPermissions[0]);
  }
}

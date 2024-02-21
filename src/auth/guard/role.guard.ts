import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../users/interfaces/user.interface';
import { findRequiredRoles } from '../decorator';
import { AppException, ERROR_CODE } from '../../exceptions';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // Retrieve the set of roles needed to access the current route
    const requiredRoles = findRequiredRoles(this.reflector, context);
    // If there is no required role, serve the route
    if (!requiredRoles || !requiredRoles.length) return true;
    const user = context.switchToHttp().getRequest().user as User;
    // Check whether the user is logged in
    if (!user) throw new AppException(ERROR_CODE.NOT_LOGGED_IN);
    // If the user has one of the needed permissions, serve the request
    for (const requiredRole of requiredRoles) if (user.role === requiredRole) return true;
    // The user has none of the required permissions, throw an error
    throw new AppException(ERROR_CODE.FORBIDDEN_INVALID_ROLE, requiredRoles[0]);
  }
}

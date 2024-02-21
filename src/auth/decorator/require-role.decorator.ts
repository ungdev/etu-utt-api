import { ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

export const REQUIRED_ROLES_KEY = 'requiredRoles';
/**
 * Use this decorator for any non-public route that requires a specific or one of
 * the specific role listed in the decorator
 */
export const RequireRole = (...roles: UserRole[]) => SetMetadata(REQUIRED_ROLES_KEY, roles);
export const findRequiredRoles = (reflector: Reflector, context: ExecutionContext) =>
  reflector.get<Parameters<typeof RequireRole>>(REQUIRED_ROLES_KEY, context.getHandler());

import { SetMetadata, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
/**
 * Use this decorator for any non-public route that requires a specific or one of
 * the specific permission listed in the decorator
 */
export const RequirePermission = (...permissions: string[]) => SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
export const findRequiredPermissions = (reflector: Reflector, context: ExecutionContext) =>
  reflector.get<Parameters<typeof RequirePermission>>(REQUIRED_PERMISSIONS_KEY, context.getHandler());

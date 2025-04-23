import { SetMetadata, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiPermission } from '../interfaces/permissions.interface';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
/**
 * Use this decorator for any non-public route that requires all the permissions passed in arguments.
 * Requires user to have hard-permissions, for soft-permissions, checks should be done directly in the controller.
 */
export const RequireApiPermission = (...permissions: ApiPermission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
export const findRequiredApiPermissions = (reflector: Reflector, context: ExecutionContext) =>
  reflector.get<Parameters<typeof RequireApiPermission>>(REQUIRED_PERMISSIONS_KEY, context.getHandler());

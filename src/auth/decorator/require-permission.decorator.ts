import { SetMetadata, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {Permission} from "@prisma/client";

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
/**
 * Use this decorator for any non-public route that requires all the permissions passed in arguments.
 * Requires user to have hard-permissions, for soft-permissions, checks should be done directly in the controller.
 */
export const RequirePermission = (...permissions: Permission[]) => SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
export const findRequiredPermissions = (reflector: Reflector, context: ExecutionContext) =>
  reflector.get<Parameters<typeof RequirePermission>>(REQUIRED_PERMISSIONS_KEY, context.getHandler());

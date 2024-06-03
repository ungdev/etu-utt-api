import { ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '@prisma/client';

export const REQUIRED_USER_TYPES_KEY = 'requiredUserTypes';
/**
 * Use this decorator for any non-public route that requires a specific or one of
 * the specific user type listed in the decorator
 */
export const RequireUserType = (...userTypes: UserType[]) => SetMetadata(REQUIRED_USER_TYPES_KEY, userTypes);
export const findRequiredUserTypes = (reflector: Reflector, context: ExecutionContext) =>
  reflector.get<Parameters<typeof RequireUserType>>(REQUIRED_USER_TYPES_KEY, context.getHandler());

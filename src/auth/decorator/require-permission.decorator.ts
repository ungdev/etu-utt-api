import { Reflector } from '@nestjs/core';

/**
 * Use this decorator for any non-public route that requires a specific or one of
 * the specific permission listed in the decorator
 */
export const RequirePermission = Reflector.createDecorator<string[]>();

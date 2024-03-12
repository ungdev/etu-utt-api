import { Reflector } from '@nestjs/core';

/**
 * Use this decorator to mark the current route as public.
 * The use of this route will not require the user to be logged in.
 */
export const IsPublic = Reflector.createDecorator();

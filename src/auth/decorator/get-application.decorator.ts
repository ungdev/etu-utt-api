import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestAuthData } from '../interfaces/request-auth-data.interface';
import { Application } from '../application/interfaces/application.interface';

/**
 * Get the application that made the request.
 * @returns The application property or the whole application.
 *
 * @example
 * ```
 * // INSERT EXAMPLE HERE
 * ```
 */
export const GetApplication = createParamDecorator((data: keyof Application, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return data ? (request.user as RequestAuthData)?.application[data] : (request.user as RequestAuthData)?.application;
});

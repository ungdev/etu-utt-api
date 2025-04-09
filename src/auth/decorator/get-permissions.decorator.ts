import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestAuthData } from '../interfaces/request-auth-data.interface';

/**
 * Get the permissions of a user.
 * @returns The user property or the whole user.
 *
 * @example
 * ```
 * @Get('/:ueCode/comments')
 * async getUEComments(
 *   @Param('ueCode') ueCode: string,
 *   @GetUser() user: User,
 *   @Query() dto: GetUECommentsDto,
 * ) {
 *   if (!(await this.ueService.doesUEExist(ueCode)))
 *     throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
 *   return this.ueService.getComments(
 *     ueCode,
 *     user,
 *     dto,
 *     user.permissions.includes('commentModerator'),
 *   );
 * }
 * ```
 */
export const GetPermissions = createParamDecorator((data: never, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return (request.user as RequestAuthData).permissions;
});

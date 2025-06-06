import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/users/interfaces/user.interface';
import { RequestAuthData } from '../interfaces/request-auth-data.interface';

/**
 * Get the user from the request.
 * @param data The user property to get. If not provided, the whole user is returned.
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
export const GetUser = createParamDecorator((data: keyof User, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return data ? (request.user as RequestAuthData).user[data] : (request.user as RequestAuthData).user;
});

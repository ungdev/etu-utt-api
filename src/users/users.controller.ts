import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsersSearchDto } from './dto/users-search.dto';
import UsersService from './users.service';
import { AppException, ERROR_CODE } from '../exceptions';

@Controller('users')
export default class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async searchUsers(@Query() query: UsersSearchDto) {
    return (await this.usersService.searchUsers(query)).map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.infos.nickname,
    }));
  }

  @Get('/:userId')
  async getSingleUser(@Param('userId') userId: string) {
    const user = await this.usersService.fetchUser(userId);
    if (!user) {
      throw new AppException(ERROR_CODE.NO_SUCH_USER, userId);
    }
    return this.usersService.filterPublicInfo(user);
  }
}

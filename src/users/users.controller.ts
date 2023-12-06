import { Controller, Get, NotFoundException, Param, Query, UseGuards } from "@nestjs/common";
import { JwtGuard } from '../auth/guard';
import { UsersSearchDto } from './dto/users-search.dto';
import UsersService from './users.service';

@Controller('users')
export default class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(JwtGuard)
  async searchUsers(@Query() query: UsersSearchDto) {
    return (await this.usersService.searchUsers(query)).map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.infos.nickname,
    }));
  }

  @Get('/:userId')
  @UseGuards(JwtGuard)
  async getSingleUser(@Param('userId') userId: string) {
    const user = await this.usersService.fetchUser(userId);
    if (!user) {
      throw new NotFoundException(`No user with id ${userId}`);
    }
    return this.usersService.filterPublicInfo(user);
  }
}

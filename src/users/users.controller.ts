import { Controller, Get, Body, BadRequestException, Param, Patch, Query } from '@nestjs/common';
import UsersSearchDto from './dto/users-search.dto';
import { UserUpdateDto } from './dto/users-update.dto';
import { GetUser } from '../auth/decorator';
import { User } from './interfaces/user.interface';
import UsersService from './users.service';
import { AppException, ERROR_CODE } from '../exceptions';

@Controller('users')
export default class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async searchUser(@Query() queryParams: UsersSearchDto) {
    return this.usersService.searchUsers(queryParams);
  }

  @Get('/current')
  async getCurrentUser(@GetUser() user: User) {
    return this.getSingleUser(user, user.id);
  }

  @Get('/:userId')
  async getSingleUser(@GetUser() user: User, @Param('userId') userId: string) {
    const userToFind = await this.usersService.fetchUser(userId);
    if (!userToFind) {
      throw new AppException(ERROR_CODE.NO_SUCH_USER, userId);
    }
    return this.usersService.filterInfo(userToFind, user.id === userId);
  }

  @Get('/:userId/associations')
  async getUserAssociations(@Param('userId') userId: string) {
    const user = await this.usersService.fetchUser(userId);
    if (!user) {
      throw new AppException(ERROR_CODE.NO_SUCH_USER, userId);
    }
    const assos = await this.usersService.fetchUserAssoMemberships(userId);
    return assos;
  }

  @Patch('/current')
  async updateInfos(@GetUser() user: User, @Body() dto: UserUpdateDto) {
    if (Object.values(dto).every((element) => element === undefined))
      throw new BadRequestException('You must provide at least one field to update');
    await this.usersService.updateUserProfil(user.id, dto);
    return this.usersService.filterInfo(await this.usersService.fetchUser(user.id), true);
  }
}

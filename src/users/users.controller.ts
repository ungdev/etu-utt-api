import {
  Controller,
  Get,
  Body,
  NotFoundException,
  BadRequestException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { UsersSearchDto } from './dto/users-search.dto';
import { UserUpdateDto } from './dto/users-update.dto';
import { GetUser } from '../auth/decorator';
import { User } from '../users/interfaces/user.interface';
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

  @Get('/profile')
  @UseGuards(JwtGuard)
  async getProfile(@GetUser() user: User) {
    const completeUser = await this.usersService.fetchWholeUser(user.id);
    if (!completeUser) {
      throw new NotFoundException(`No user with id ${user.id}`);
    }
    return this.usersService.filterInfo(completeUser, true);
  }

  @Get('/current')
  @UseGuards(JwtGuard)
  async getCurrentUser(@GetUser() user: User) {
    return this.getSingleUser(user.id);
  }

  @Get('/:userId')
  async getSingleUser(@Param('userId') userId: string) {
    const user = await this.usersService.fetchWholeUser(userId);
    if (!user) {
      throw new AppException(ERROR_CODE.NO_SUCH_USER, userId);
    }
    return this.usersService.filterInfo(user, false);
  }

  @Get('/:userId/associations')
  @UseGuards(JwtGuard)
  async getUserAssociations(@Param('userId') userId: string) {
    const user = await this.usersService.fetchWholeUser(userId);
    if (!user) {
      throw new AppException(ERROR_CODE.NO_SUCH_USER, userId);
    }
    const assos = await this.usersService.fetchUserAssociation(userId);
    return assos;
  }

  @Patch('/current')
  @UseGuards(JwtGuard)
  async updateInfos(@GetUser() user: User, @Body() dto: UserUpdateDto) {
    Object.values(dto).every((element) => {
      if (element === undefined) {
        throw new BadRequestException('You must provide at least one field to update');
      }
    });
    const completeUser = await this.usersService.fetchWholeUser(user.id);
    this.usersService.updateUserProfil(completeUser, dto);
  }
}

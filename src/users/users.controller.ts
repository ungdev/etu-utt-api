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
import { User } from '../prisma/types';
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

  @Get('/current')
  @UseGuards(JwtGuard)
  async getProfile(@GetUser() user: User) {
    const completeUser = await this.usersService.fetchWholeUser(user.id);
    if (!completeUser) {
      throw new NotFoundException(`No user with id ${user.id}`);
    }
    return this.usersService.filterInfo(completeUser, true);
  }

  @Get('/:userId')
  @UseGuards(JwtGuard)
  async getSingleUser(@Param('userId') userId: string) {
    const user = await this.usersService.fetchWholeUser(userId);
    if (!user) {
      throw new NotFoundException(`No user with id ${userId}`);
    }
    return this.usersService.filterInfo(user, false);
  }

  @Get('/:userId/associations')
  @UseGuards(JwtGuard)
  async getUserAssociations(@Param('userId') userId: string) {
    const user = await this.usersService.fetchUserAssociation(userId);
    if (!user) {
      throw new NotFoundException(`No user with id ${userId}`);
    }
    return this.usersService.filterUserAsso(user);
  }
  
  @Patch('/current')
  @UseGuards(JwtGuard)
  async updateInfos(@GetUser() user: User, @Body() dto: UserUpdateDto) {
    Object.values(dto).every((element) => {
      if (element === undefined) {
        throw new BadRequestException(
          'You must provide at least one field to update',
        );
      }
    });
    const completeUser = await this.usersService.fetchWholeUser(user.id);
    this.usersService.updateUserProfil(completeUser, dto);
  }
}

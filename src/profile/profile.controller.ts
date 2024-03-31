import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { User } from '../users/interfaces/user.interface';
import { ProfileUpdateDto } from './dto/profile-update.dto';
import { AppException, ERROR_CODE } from '../exceptions';
import { ProfileService } from './profile.service';
import UsersService from '../users/users.service';
import { HomepageWidgetsUpdateDto } from './dto/homepage-widgets-update.dto';
import { RawHomepageWidget } from '../prisma/types';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService, private userService: UsersService) {}

  @Get()
  async getProfile(@GetUser() user: User) {
    return this.formatProfile(user);
  }

  @Post()
  async updateProfile(@GetUser() user: User, @Body() dto: ProfileUpdateDto) {
    if (dto.nickname === undefined && dto.website === undefined && dto.passions === undefined) {
      throw new AppException(ERROR_CODE.NO_FIELD_PROVIDED);
    }
    const updatedUser = await this.userService.updateUser(user.id, dto);
    return this.formatProfile(updatedUser);
  }

  @Get('/homepage')
  async getHomepageWidgets(@GetUser() user: User) {
    return this.formatHomepageWidgets(await this.profileService.getHomepageWidgets(user.id));
  }

  @Put('/homepage')
  async setHomepageWidget(@GetUser() user: User, @Body() dto: HomepageWidgetsUpdateDto) {
    for (let i = 0; i < dto.length; i++) {
      for (let j = 0; j < dto.length; j++) {
        if (
          i !== j &&
          dto[i].x + dto[i].width > dto[j].x &&
          dto[j].x + dto[j].width > dto[i].x &&
          dto[i].y + dto[i].height > dto[j].y &&
          dto[j].y + dto[j].height > dto[i].y
        ) {
          throw new AppException(ERROR_CODE.WIDGET_OVERLAPPING, `${i}`, `${j}`);
        }
      }
    }
    return this.formatHomepageWidgets(await this.profileService.setHomepageWidgets(user.id, dto));
  }

  private formatProfile(user: User) {
    return {
      id: user.id,
      login: user.login,
      firstName: user.firstName,
      lastName: user.lastName,
      studentId: user.studentId,
      sex: user.infos.sex,
      nickname: user.infos.nickname,
      passions: user.infos.passions,
      website: user.infos.website,
      birthday: user.infos.birthday,
    };
  }

  private formatHomepageWidgets(widgets: RawHomepageWidget[]) {
    return widgets.map((widget) => ({
      x: widget.x,
      y: widget.y,
      width: widget.width,
      height: widget.height,
      widget: widget.widget,
    }));
  }
}

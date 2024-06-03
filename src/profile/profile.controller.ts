import { Body, Controller, Get, Put } from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { User } from '../users/interfaces/user.interface';
import { AppException, ERROR_CODE } from '../exceptions';
import { ProfileService } from './profile.service';
import { HomepageWidgetsUpdateDto } from './dto/homepage-widgets-update.dto';
import { RawHomepageWidget } from '../prisma/types';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

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

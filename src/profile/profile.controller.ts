import { Body, Controller, Get, Put } from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { User } from '../users/interfaces/user.interface';
import { AppException, ERROR_CODE } from '../exceptions';
import { ProfileService } from './profile.service';
import { HomepageWidgetsUpdateReqDto } from './dto/req/homepage-widgets-update-req.dto';
import { RawHomepageWidget } from '../prisma/types';
import {ApiBody, ApiOkResponse, ApiOperation, ApiTags} from '@nestjs/swagger';
import HomepageWidgetResDto from './dto/res/homepage-widget-res.dto';
import { ApiAppErrorResponse } from '../app.dto';

@Controller('profile')
@ApiTags('Profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get('/homepage')
  @ApiOperation({ description: 'Get the homepage disposition of logged in user.' })
  @ApiOkResponse({ type: HomepageWidgetResDto, isArray: true })
  async getHomepageWidgets(@GetUser() user: User): Promise<HomepageWidgetResDto[]> {
    return this.formatHomepageWidgets(await this.profileService.getHomepageWidgets(user.id));
  }

  @Put('/homepage')
  @ApiOperation({ description: 'Get the homepage disposition of logged in user.' })
  @ApiBody({ type: HomepageWidgetsUpdateReqDto })
  @ApiOkResponse({ type: HomepageWidgetResDto, isArray: true })
  @ApiAppErrorResponse(ERROR_CODE.WIDGET_OVERLAPPING, 'Some widgets are overlapping.')
  async setHomepageWidget(
    @GetUser() user: User,
    @Body() dto: HomepageWidgetsUpdateReqDto,
  ): Promise<HomepageWidgetResDto[]> {
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

  private formatHomepageWidgets(widgets: RawHomepageWidget[]): HomepageWidgetResDto[] {
    return widgets.map((widget) => ({
      x: widget.x,
      y: widget.y,
      width: widget.width,
      height: widget.height,
      widget: widget.widget,
    }));
  }
}

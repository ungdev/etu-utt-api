import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import WeeklyInfoResDto from './dto/res/weekly-info-res.dto';
import { ConfigService } from '../../config/config.service';

@Controller('assos/weekly')
@ApiTags('Weekly')
export default class WeeklyWithoutAssoIdController {
  constructor(readonly config: ConfigService) {}

  @Get('/info')
  @ApiOperation({ description: 'Returns information about weeklies.' })
  @ApiOkResponse({ type: WeeklyInfoResDto })
  getWeeklyInfo(): WeeklyInfoResDto {
    return {
      sendDay: this.config.WEEKLY_SEND_DAY,
      sendHour: this.config.WEEKLY_SEND_HOUR,
    };
  }
}

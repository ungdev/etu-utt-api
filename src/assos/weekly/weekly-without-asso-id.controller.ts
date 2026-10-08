import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WeeklyInfoResDto } from '@/assos/weekly/dto/res/weekly-info-res.dto.js';
import { ConfigService } from '@/config/config.service.js';

@Controller('assos/weekly')
@ApiTags('Weekly')
export class WeeklyWithoutAssoIdController {
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

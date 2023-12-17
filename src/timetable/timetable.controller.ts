import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import TimetableService from './timetable.service';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { User } from '../users/interfaces/user.interface';

@Controller('/timetable')
export class TimetableController {
  constructor(private timetableService: TimetableService) {}

  @Get('/current/daily/:day/:month/:year')
  @UseGuards(JwtGuard)
  async getSelfDaily(
    @Param('day', ParseIntPipe) day: number,
    @Param('month', ParseIntPipe) month: number,
    @Param('year', ParseIntPipe) year: number,
    @GetUser() user: User,
  ) {
    const date = new Date(year, month - 1, day);
    const timetable = await this.timetableService.getTimetableOfUserInNext24h(user.id, date);
    return timetable.map((timetable) => ({
      id: `${timetable.index}@${timetable.entryId}`,
      start: timetable.start,
      end: timetable.end,
      location: timetable.location,
    }));
  }
}

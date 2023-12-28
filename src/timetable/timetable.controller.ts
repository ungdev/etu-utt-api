import {Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post, UseGuards} from '@nestjs/common';
import TimetableService from './timetable.service';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { User } from '../users/interfaces/user.interface';
import { regex, RegexPipe } from '../app.pipe';
import TimetableCreateEntryDto from "./dto/timetable-create-entry.dto";

@Controller('/timetable')
export class TimetableController {
  constructor(private timetableService: TimetableService) {}

  @Get('/current/daily/:date/:month/:year')
  @UseGuards(JwtGuard)
  async getSelfDaily(
    @Param('date', ParseIntPipe) date: number,
    @Param('month', ParseIntPipe) month: number,
    @Param('year', ParseIntPipe) year: number,
    @GetUser() user: User,
  ) {
    const dateObject = new Date(year, month - 1, date);
    const timetable = await this.timetableService.getTimetableOfUserInNext24h(user.id, dateObject);
    return timetable.map((timetable) => ({
      id: `${timetable.index}@${timetable.entryId}`,
      start: timetable.start,
      end: timetable.end,
      location: timetable.location,
    }));
  }

  @Get('/:entryId')
  @UseGuards(JwtGuard)
  async getEntryDetails(@Param('entryId', new RegexPipe(regex.timetableOccurrenceId)) entryId: string, @GetUser() user: User) {
    [, entryId] = entryId.split('@');
    const entryOverride = await this.timetableService.fetchEntryOverride(entryId);
    if (entryOverride) {
      entryId = entryOverride.overrideTimetableEntryId;
    }
    const entry = await this.timetableService.getEntryDetails(entryId, user.id);
    if (!entry) {
      throw new NotFoundException(`No timetable event with id ${entryId}`);
    }
    return {
      id: entry.id,
      location: entry.location,
      duration: entry.occurrenceDuration,
      firstRepetitionDate: entry.eventStart,
      lastRepetitionDate: new Date(entry.eventStart.getTime() + (entry.occurrencesCount - 1) * entry.repeatEvery),
      repetitionFrequency: entry.repeatEvery,
      repetitions: entry.occurrencesCount,
      groups: entry.timetableGroups.map((group) => group.id),
      overrides: entry.overwrittenBy.map((entryOverride) => ({
        id: entryOverride.id,
        location: entryOverride.location,
        firstRepetitionDate: new Date(entry.eventStart.getTime() + entryOverride.occurrenceRelativeStart),
        lastRepetitionDate: new Date(
          entry.eventStart.getTime() +
            entry.occurrencesCount * entry.repeatEvery +
            entryOverride.occurrenceRelativeStart,
        ),
        firstOccurrenceOverride: entryOverride.applyFrom,
        lastOccurrenceOverride: entryOverride.applyUntil,
        overrideFrequency: entryOverride.repeatEvery,
        groups: entryOverride.timetableGroups.map((group) => group.id),
      })),
    };
  }

  @Get('/current/groups')
  @UseGuards(JwtGuard)
  async getGroups(@GetUser() user: User) {
    const groups = await this.timetableService.getTimetableGroups(user.id);
    return groups.map((group) => ({ id: group.id, name: group.name, priority: group.userTimetableGroups[0].priority }));
  }

  @Post('/current')
  @UseGuards(JwtGuard)
  async createEntry(@Body() body: TimetableCreateEntryDto) {
    const entry = await this.timetableService.createTimetableEntry(body);
    return {
      id: entry.id,
      location: entry.location,
      duration: entry.occurrenceDuration,
      firstRepetitionDate: entry.eventStart,
      lastRepetitionDate: new Date(entry.eventStart.getTime() + (entry.occurrencesCount - 1) * entry.repeatEvery),
      repetitionFrequency: entry.repeatEvery,
      repetitions: entry.occurrencesCount,
      groups: entry.timetableGroups.map((group) => group.id),
      overrides: [],
    };
  }
}

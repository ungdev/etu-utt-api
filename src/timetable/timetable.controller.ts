import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import TimetableService from './timetable.service';
import { GetUser } from '../auth/decorator';
import { User } from '../users/interfaces/user.interface';
import { PositiveNumberValidationPipe, regex, RegexPipe } from '../app.pipe';
import TimetableCreateEntryReqDto from './dto/req/timetable-create-entry-req.dto';
import TimetableUpdateEntryReqDto from './dto/req/timetable-update-entry-req.dto';
import { DetailedTimetableEntry, ResponseDetailedTimetableEntry } from './interfaces/timetable.interface';
import TimetableDeleteOccurrencesReqDto from './dto/req/timetable-delete-occurrences-req.dto';
import { AppException, ERROR_CODE } from '../exceptions';

@Controller('/timetable')
export class TimetableController {
  constructor(private timetableService: TimetableService) {}

  @Get('/current/daily/:date/:month/:year')
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

  @Get('/current/:daysCount/:date/:month/:year')
  async getSelfTimetable(
    @Param('daysCount', PositiveNumberValidationPipe) daysCount: number,
    @Param('date', PositiveNumberValidationPipe) date: number,
    @Param('month', PositiveNumberValidationPipe) month: number,
    @Param('year', PositiveNumberValidationPipe) year: number,
    @GetUser() user: User,
  ) {
    const dateObject = new Date(year, month - 1, date);
    const timetable = await this.timetableService.getTimetableOfUserInNextXMs(
      user.id,
      dateObject,
      daysCount * 24 * 3_600_000,
    );
    return timetable.map((timetable) => ({
      id: `${timetable.index}@${timetable.entryId}`,
      start: timetable.start,
      end: timetable.end,
      location: timetable.location,
    }));
  }

  @Get('/:entryId')
  async getEntryDetails(
    @Param('entryId', new RegexPipe(regex.timetableOccurrenceId)) entryId: string,
    @GetUser() user: User,
  ) {
    [, entryId] = entryId.split('@');
    const entryOverride = await this.timetableService.fetchEntryOverride(entryId);
    if (entryOverride) {
      entryId = entryOverride.overrideTimetableEntryId;
    }
    const entry = await this.timetableService.getEntryDetails(entryId, user.id);
    if (!entry) {
      throw new AppException(ERROR_CODE.NO_SUCH_TIMETABLE_ENTRY, entryId);
    }
    return this.formatEntryDetails(entry);
  }

  @Get('/current/groups')
  async getGroups(@GetUser() user: User) {
    const groups = await this.timetableService.getTimetableGroups(user.id);
    return groups.map((group) => ({ id: group.id, name: group.name, priority: group.priority }));
  }

  @Post('/current')
  async createEntry(@GetUser('id') userId: string, @Body() body: TimetableCreateEntryReqDto) {
    for (const groupId of body.groups) {
      if (!(await this.timetableService.groupExists(groupId, userId))) {
        throw new AppException(ERROR_CODE.NO_SUCH_TIMETABLE_GROUP, groupId);
      }
    }
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

  @Patch('/current/:entryId')
  async updateEntry(
    @GetUser() user: User,
    @Param(
      'entryId',
      new ParseUUIDPipe({ exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'entryId') }),
    )
    entryId: string,
    @Body() body: TimetableUpdateEntryReqDto,
  ) {
    if (!(await this.timetableService.entryExists(entryId, user.id))) {
      throw new AppException(ERROR_CODE.NO_SUCH_TIMETABLE_ENTRY, entryId);
    }
    for (const groupId of body.for) {
      if (!(await this.timetableService.groupExists(groupId, user.id))) {
        throw new AppException(ERROR_CODE.NO_SUCH_TIMETABLE_GROUP, groupId);
      }
    }
    const groups = await this.timetableService.getTimetableGroupsOfEntry(entryId, user.id);
    for (const groupId of body.for) {
      if (!groups.some((group) => group.id === groupId)) {
        throw new AppException(ERROR_CODE.GROUP_NOT_PART_OF_ENTRY, groupId, entryId);
      }
    }
    const entry = await this.timetableService.updateTimetableEntry(entryId, body, user.id);
    return this.formatEntryDetails(entry);
  }

  @Delete('/current/:entryId')
  async deleteOccurrences(
    @GetUser() user: User,
    @Param(
      'entryId',
      new ParseUUIDPipe({ exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'entryId') }),
    )
    entryId: string,
    @Body() body: TimetableDeleteOccurrencesReqDto,
  ) {
    if (!(await this.timetableService.entryExists(entryId, user.id))) {
      throw new AppException(ERROR_CODE.NO_SUCH_TIMETABLE_ENTRY, entryId);
    }
    for (const groupId of body.for) {
      if (!(await this.timetableService.groupExists(groupId, user.id))) {
        throw new AppException(ERROR_CODE.NO_SUCH_TIMETABLE_GROUP, groupId);
      }
    }
    const groups = await this.timetableService.getTimetableGroupsOfEntry(entryId, user.id);
    for (const groupId of body.for) {
      if (!groups.some((group) => group.id === groupId)) {
        throw new AppException(ERROR_CODE.GROUP_NOT_PART_OF_ENTRY, groupId, entryId);
      }
    }
    const entry = await this.timetableService.deleteOccurrences(entryId, body, user.id);
    return this.formatEntryDetails(entry);
  }

  /**
   * Formats a {@link DetailedTimetableEntry} into a {@link ResponseDetailedTimetableEntry}.
   * @param entry The entry to format.
   */
  private formatEntryDetails(entry: DetailedTimetableEntry): ResponseDetailedTimetableEntry {
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
        firstRepetitionDate: new Date(
          entry.eventStart.getTime() +
            entryOverride.applyFrom * entry.repeatEvery +
            entryOverride.occurrenceRelativeStart,
        ),
        lastRepetitionDate: new Date(
          entry.eventStart.getTime() +
            entryOverride.applyUntil * entry.repeatEvery +
            entryOverride.occurrenceRelativeStart,
        ),
        firstOccurrenceOverride: entryOverride.applyFrom,
        lastOccurrenceOverride: entryOverride.applyUntil,
        overrideFrequency: entryOverride.repeatEvery,
        groups: entryOverride.timetableGroups.map((group) => group.id),
        deletion: entryOverride.delete,
      })),
    };
  }
}

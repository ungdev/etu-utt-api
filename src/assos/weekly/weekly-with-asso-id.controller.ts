import { Body, Controller, Delete, Get, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';
import WeeklyResDto from './dto/res/weekly-res.dto';
import { ApiAppErrorResponse, paginatedResponseDto } from '../../app.dto';
import { AppException, ERROR_CODE } from '../../exceptions';
import { ParamAsso } from '../decorator/get-asso';
import { Asso } from '../interfaces/asso.interface';
import AssoGetWeeklyReqDto from './dto/req/weekly-search-req.dto';
import { GetUser } from '../../auth/decorator';
import { User } from '../../users/interfaces/user.interface';
import AssosPostWeeklyReqDto from './dto/req/weekly-req.dto';
import { UUIDParam } from '../../app.pipe';
import { AssoWeekly } from '../interfaces/weekly.interface';
import { ConfigModule } from '../../config/config.module';
import WeeklyService from './weekly.service';
import { AssosService } from '../assos.service';

@Controller('assos/:assoId/weekly')
export class WeeklyWithAssoIdController {
  constructor(readonly weeklyService: WeeklyService, readonly assosService: AssosService, readonly config: ConfigModule) {}

  @Get()
  @ApiOperation({ description: 'Get weeklies from query parameter `from` to query parameter `to`.' })
  @ApiQuery({ name: 'from', type: String })
  @ApiQuery({ name: 'to', type: String, default: `\`from\` + env.PAGINATION_PAGE_SIZE days`, required: false })
  @ApiOkResponse({ type: WeeklyResDto })
  @ApiAppErrorResponse(ERROR_CODE.PARAM_DATE_MUST_BE_AFTER, '`to` must come after `from` (or be equal)')
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user issuing the request does not have the permission weekly',
  )
  async searchWeeklies(
    @ParamAsso() asso: Asso,
    @Query() { from, to, page }: AssoGetWeeklyReqDto,
    @GetUser() user: User,
  ): Promise<Pagination<WeeklyResDto>> {
    from = from.dropTime();
    to = to?.dropTime();
    if (to && from > to)
      throw new AppException(ERROR_CODE.PARAM_DATE_MUST_BE_AFTER, to.toISOString(), from.toISOString());
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'weekly')))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'weekly');
    const { weeklies, count } = await this.weeklyService.searchWeeklies(asso.id, from, to, page);
    return {
      items: weeklies,
      itemCount: count,
      itemsPerPage: this.config.PAGINATION_PAGE_SIZE,
    };
  }

  @Post()
  @ApiOperation({ description: 'Create a weekly for the given association.' })
  @ApiCreatedResponse({ type: WeeklyResDto })
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user issuing the request does not have the permission weekly',
  )
  @ApiAppErrorResponse(ERROR_CODE.WEEKLY_ALREADY_SENT_FOR_WEEK, 'The weekly was already sent for the specified week')
  @ApiAppErrorResponse(ERROR_CODE.WEEKLY_ALREADY_PLANNED_FOR_WEEK, 'The asso already has a weekly planned for the requested week')
  async createWeekly(
    @ParamAsso() asso: Asso,
    @Body() dto: AssosPostWeeklyReqDto,
    @GetUser() user: User,
  ): Promise<WeeklyResDto> {
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'weekly')))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'weekly');
    if (this.weeklyService.getWeeklySendDate(dto.date) < new Date())
      throw new AppException(ERROR_CODE.WEEKLY_ALREADY_SENT_FOR_WEEK, dto.date.toISOString());
    if (await this.weeklyService.hasWeekly(asso.id, dto.date))
      throw new AppException(ERROR_CODE.WEEKLY_ALREADY_PLANNED_FOR_WEEK);
    return this.weeklyService.addWeekly(asso.id, dto.title, dto.message, dto.date);
  }

  @Patch('/:weeklyId')
  @ApiOperation({ description: 'Update a weekly for the given association.' })
  @ApiOkResponse({ type: paginatedResponseDto(WeeklyResDto) })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO)
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user issuing the request does not have the permission weekly',
  )
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_WEEKLY, 'The weekly does not exist for the specified asso')
  @ApiAppErrorResponse(ERROR_CODE.WEEKLY_ALREADY_SENT, 'The weekly that is beeing modified was already sent')
  @ApiAppErrorResponse(ERROR_CODE.WEEKLY_ALREADY_SENT_FOR_WEEK, 'The weekly was already sent for the specified week')
  @ApiAppErrorResponse(ERROR_CODE.WEEKLY_ALREADY_PLANNED_FOR_WEEK, 'The asso already has a weekly planned for the requested week')
  async updateWeekly(
    @ParamAsso() asso: Asso,
    @UUIDParam('weeklyId') weeklyId: string,
    @Body() dto: AssosPostWeeklyReqDto,
    @GetUser() user: User,
  ): Promise<WeeklyResDto> {
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'weekly')))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'weekly');
    const weekly: AssoWeekly = await this.weeklyService.getWeekly(weeklyId, asso.id);
    if (!weekly) throw new AppException(ERROR_CODE.NO_SUCH_WEEKLY, weeklyId);
    if (this.weeklyService.getWeeklySendDate(weekly.date) < new Date())
      throw new AppException(ERROR_CODE.WEEKLY_ALREADY_SENT);
    if (this.weeklyService.getWeeklySendDate(dto.date) < new Date())
      throw new AppException(ERROR_CODE.WEEKLY_ALREADY_SENT_FOR_WEEK, dto.date.toISOString());
    if (await this.weeklyService.hasWeekly(asso.id, weekly.date, weekly.id))
      throw new AppException(ERROR_CODE.WEEKLY_ALREADY_PLANNED_FOR_WEEK);
    return this.weeklyService.updateWeekly(weeklyId, dto);
  }

  @Delete('/:weeklyId')
  @ApiOperation({ description: 'Delete a weekly for the given association.' })
  @ApiOkResponse({ type: WeeklyResDto })
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user issuing the request does not have the permission weekly',
  )
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_WEEKLY)
  @ApiAppErrorResponse(ERROR_CODE.WEEKLY_ALREADY_SENT, 'The weekly that is beeing modified was already sent')
  async deleteWeekly(
    @ParamAsso() asso: Asso,
    @UUIDParam('weeklyId') weeklyId: string,
    @GetUser() user: User,
  ): Promise<WeeklyResDto> {
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'weekly')))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'weekly');
    const weekly: AssoWeekly = await this.weeklyService.getWeekly(weeklyId, asso.id);
    if (!weekly) throw new AppException(ERROR_CODE.NO_SUCH_WEEKLY, weeklyId);
    if (this.weeklyService.getWeeklySendDate(weekly.date) < new Date())
      throw new AppException(ERROR_CODE.WEEKLY_ALREADY_SENT);
    return this.weeklyService.deleteWeekly(weeklyId);
  }
}
import { Body, Controller, Delete, Get, Headers, Param, Put, Query } from '@nestjs/common';
import { UeSearchReqDto } from './dto/req/ue-search-req.dto';
import { UeService } from './ue.service';
import { GetUser, IsPublic, RequireUserType } from '../auth/decorator';
import { User } from '../users/interfaces/user.interface';
import { UUIDParam } from '../app.pipe';
import { AppException, ERROR_CODE } from '../exceptions';
import { UeRateReqDto } from './dto/req/ue-rate-req.dto';
import { Ue } from './interfaces/ue.interface';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAppErrorResponse, paginatedResponseDto } from '../app.dto';
import { UeDetailResDto } from './dto/res/ue-detail-res.dto';
import UeOverviewResDto from './dto/res/ue-overview-res.dto';
import UeRateCriterionResDto from './dto/res/ue-rate-criterion-res.dto';
import UeRateResDto from './dto/res/ue-rate-res.dto';
import { Language, UserType } from '@prisma/client';

@Controller('ue')
@ApiTags('UE')
export class UeController {
  constructor(readonly ueService: UeService) {}

  @Get()
  @IsPublic()
  @ApiOperation({
    description: 'Search for UE, eventually with advanced search using the available fields in the request.',
  })
  @ApiOkResponse({ type: paginatedResponseDto(UeOverviewResDto) })
  async searchUe(
    @Headers('language') language: Language,
    @Query() queryParams: UeSearchReqDto,
  ): Promise<Pagination<UeOverviewResDto>> {
    const res = await this.ueService.searchUes(queryParams, language);
    return {
      ...res,
      items: res.items.map((ue) => this.formatUeOverview(ue)),
    };
  }

  @Get('/:ueCode')
  @IsPublic()
  @ApiOperation({ description: 'Search for a specific UE by its code.' })
  @ApiOkResponse({ type: UeDetailResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_UE, 'There is no UE with the provided code.')
  async getUe(@Param('ueCode') ueCode: string, @GetUser() user: User): Promise<UeDetailResDto> {
    if (!(await this.ueService.doesUeExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.formatDetailedUe(await this.ueService.getUe(ueCode.toUpperCase()), user);
  }

  @Get('/rate/criteria')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  @ApiOperation({ description: 'Get the different criteria on which users can rate UEs.' })
  @ApiOkResponse({ type: UeRateCriterionResDto, isArray: true })
  async GetRateCriteria(): Promise<UeRateCriterionResDto[]> {
    return this.ueService.getRateCriteria();
  }

  @Get('/:ueCode/rate')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  @ApiOperation({ description: 'Get the rates given by the current user.' })
  @ApiOkResponse({
    description: 'Keys are criterionId and values are the marks.',
    schema: { type: 'object', additionalProperties: { type: 'number' } },
  })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_UE, 'There is no UE with the provided code.')
  async GetRateUe(@Param('ueCode') ueCode: string, @GetUser() user: User): Promise<{ [criterionId: string]: number }> {
    if (!(await this.ueService.doesUeExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    const rates = await this.ueService.getRateUe(user.id, ueCode);
    const res = {};
    for (const rate of rates) {
      res[rate.criterionId] = rate.value;
    }
    return res;
  }

  @Put('/:ueCode/rate')
  @RequireUserType('STUDENT')
  @ApiOperation({ description: 'Rate the UE by some criterion.' })
  @ApiOkResponse({ type: UeRateReqDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_UE, 'There is no UE with the provided code.')
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_CRITERION, 'There is no criterion with the provided id.')
  @ApiAppErrorResponse(ERROR_CODE.NOT_ALREADY_DONE_UE, 'Thrown when user has not done the UE.')
  async RateUe(
    @Param('ueCode') ueCode: string,
    @GetUser() user: User,
    @Body() dto: UeRateReqDto,
  ): Promise<UeRateResDto> {
    if (!(await this.ueService.doesUeExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.doesCriterionExist(dto.criterion))) throw new AppException(ERROR_CODE.NO_SUCH_CRITERION);
    if (!(await this.ueService.hasAlreadyDoneThisUe(user.id, ueCode)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    return this.ueService.doRateUe(user.id, ueCode, dto);
  }

  @Delete('/:ueCode/rate/:criterionId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  @ApiOperation({ description: 'Remove the rate on the UE about some criterion.' })
  @ApiOkResponse({ type: UeRateReqDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_UE, 'There is no UE with the provided code.')
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_CRITERION, 'There is no criterion with the provided id.')
  @ApiAppErrorResponse(ERROR_CODE.NOT_ALREADY_RATED_UE, 'Thrown if user has not rated the UE.')
  async UnRateUe(
    @Param('ueCode') ueCode: string,
    @UUIDParam('criterionId') criterionId: string,
    @GetUser() user: User,
  ): Promise<UeRateResDto> {
    if (!(await this.ueService.doesUeExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.doesCriterionExist(criterionId))) throw new AppException(ERROR_CODE.NO_SUCH_CRITERION);
    if (!(await this.ueService.hasAlreadyRated(user.id, ueCode, criterionId)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_RATED_UE, ueCode, criterionId);
    return this.ueService.unRateUe(user.id, ueCode, criterionId);
  }

  @Get('/of/me')
  @RequireUserType('STUDENT')
  @ApiOperation({ description: 'Get the UEs of the current user.' })
  @ApiOkResponse({ type: UeOverviewResDto, isArray: true })
  async getMyUes(@GetUser() user: User): Promise<UeOverviewResDto[]> {
    return (await this.ueService.getUesOfUser(user.id)).map((ue) => this.formatUeOverview(ue));
  }

  private formatUeOverview(ue: Ue): UeOverviewResDto {
    return {
      code: ue.code,
      inscriptionCode: ue.inscriptionCode,
      name: ue.name,
      credits: ue.credits.map((c) => ({
        credits: c.credits,
        category: {
          code: c.category.code,
          name: c.category.name,
        },
      })),
      branchOption: ue.branchOption.map((branchOption) => ({
        code: branchOption.code,
        name: branchOption.name,
        branch: {
          code: branchOption.branch.code,
          name: branchOption.branch.name,
        },
      })),
      info: {
        requirements: ue.info.requirements.map((r) => r.code),
        comment: ue.info.comment,
        degree: ue.info.degree,
        languages: ue.info.languages,
        minors: ue.info.minors,
        objectives: ue.info.objectives,
        program: ue.info.program,
      },
      openSemester: ue.openSemester.map((semester) => ({
        code: semester.code,
        start: semester.start,
        end: semester.end,
      })),
    };
  }

  private formatDetailedUe(ue: Ue, user?: User): UeDetailResDto {
    const includeStarVotes = user?.userType === UserType.STUDENT || user?.userType === UserType.FORMER_STUDENT;
    return {
      code: ue.code,
      inscriptionCode: ue.inscriptionCode,
      name: ue.name,
      credits: ue.credits.map((c) => ({
        credits: c.credits,
        category: {
          code: c.category.code,
          name: c.category.name,
        },
      })),
      branchOption: ue.branchOption.map((branchOption) => ({
        code: branchOption.code,
        name: branchOption.name,
        branch: {
          code: branchOption.branch.code,
          name: branchOption.branch.name,
        },
      })),
      info: {
        requirements: ue.info.requirements.map((r) => r.code),
        comment: ue.info.comment,
        degree: ue.info.degree,
        languages: ue.info.languages,
        minors: ue.info.minors,
        objectives: ue.info.objectives,
        program: ue.info.program,
      },
      openSemester: ue.openSemester.map((semester) => ({
        code: semester.code,
        start: semester.start,
        end: semester.end,
      })),
      workTime: {
        cm: ue.workTime.cm,
        td: ue.workTime.td,
        tp: ue.workTime.tp,
        the: ue.workTime.the,
        project: ue.workTime.project,
        internship: ue.workTime.internship,
      },
      starVotes: includeStarVotes ? ue.starVotes : null,
    };
  }
}

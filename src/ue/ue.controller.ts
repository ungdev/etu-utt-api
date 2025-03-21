import { Body, Controller, Delete, Get, Headers, Param, Put, Query, Res } from '@nestjs/common';
import { HttpStatusCode } from 'axios';
import type { Response } from 'express';
import { UeSearchReqDto } from './dto/req/ue-search-req.dto';
import { UeService } from './ue.service';
import { GetUser, IsPublic, RequireUserType } from '../auth/decorator';
import { User } from '../users/interfaces/user.interface';
import { UUIDParam } from '../app.pipe';
import { AppException, ERROR_CODE } from '../exceptions';
import { Ue, UeStarVoteEntry } from './interfaces/ue.interface';
import { UeRateReqDto } from './dto/req/ue-rate-req.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAppErrorResponse, paginatedResponseDto } from '../app.dto';
import { UeDetailResDto } from './dto/res/ue-detail-res.dto';
import { UeOverviewResDto } from './dto/res/ue-overview-res.dto';
import UeRateCriterionResDto from './dto/res/ue-rate-criterion-res.dto';
import UeRateResDto from './dto/res/ue-rate-res.dto';
import { Language, UserType } from '@prisma/client';
import { UeRating } from './interfaces/rate.interface';

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
    @GetUser() user: User,
    @Headers('language') language: Language,
    @Query() queryParams: UeSearchReqDto,
  ): Promise<Pagination<UeOverviewResDto>> {
    const res = await this.ueService.searchUes(queryParams, language);
    return {
      ...res,
      items: res.items.map((ue) =>
        this.formatUeOverview(
          ue,
          queryParams.preferredLang ? [queryParams.preferredLang, language] : [language],
          user?.branchSubscriptions.map((sub) => [sub.branchOption.code, sub.branchOption.branch.code]).flat() ?? [], // TODO : add more filters
        ),
      ),
    };
  }

  @Get('/:ueCode')
  @IsPublic()
  @ApiOperation({ description: 'Search for a specific UE by its code.' })
  @ApiOkResponse({ type: UeDetailResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_UE, 'There is no UE with the provided code.')
  async getUe(
    @GetUser() user: User,
    @Param('ueCode') ueCode: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void | UeDetailResDto> {
    if (!(await this.ueService.doesUeExist(ueCode))) {
      // Check for aliases or throw an error
      const alias = await this.ueService.findAlias(ueCode);
      if (alias?.standsFor) return res.redirect(HttpStatusCode.MovedPermanently, `./${alias.standsFor}`);
      throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    }
    return this.formatDetailedUe(await this.ueService.getUe(ueCode.toUpperCase()), user?.userType);
  }

  @Get('/rate/criteria')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  @ApiOperation({ description: 'Get the different criteria on which users can rate UEs.' })
  @ApiOkResponse({ type: UeRateCriterionResDto, isArray: true })
  async getRateCriteria(): Promise<UeRateCriterionResDto[]> {
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
  async getUeRate(@Param('ueCode') ueCode: string, @GetUser() user: User): Promise<{ [ueofCode: string]: UeRating[] }> {
    if (!(await this.ueService.doesUeExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.ueService.getRateUe(user.id, ueCode);
  }

  @Put('/ueof/:ueofCode/rate')
  @RequireUserType('STUDENT')
  @ApiOperation({ description: 'Rate the UE by some criterion.' })
  @ApiOkResponse({ type: UeRateReqDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_UE, 'There is no UE with the provided code.')
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_CRITERION, 'There is no criterion with the provided id.')
  @ApiAppErrorResponse(ERROR_CODE.NOT_ALREADY_DONE_UEOF, 'Thrown when user has not done the UE.')
  async rateUe(
    @Param('ueofCode') ueofCode: string,
    @GetUser() user: User,
    @Body() dto: UeRateReqDto,
  ): Promise<UeRateResDto> {
    if (!(await this.ueService.doesUeofExist(ueofCode))) throw new AppException(ERROR_CODE.NO_SUCH_UEOF, ueofCode);
    if (!(await this.ueService.doesCriterionExist(dto.criterion))) throw new AppException(ERROR_CODE.NO_SUCH_CRITERION);
    if (!(await this.ueService.hasUserAttended(ueofCode, user.id)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UEOF);
    return this.ueService.rateUeof(user.id, ueofCode, dto);
  }

  @Delete('/ueof/:ueofCode/rate/:criterionId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  @ApiOperation({ description: 'Remove the rate on the UE about some criterion.' })
  @ApiOkResponse({ type: UeRateReqDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_UE, 'There is no UE with the provided code.')
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_CRITERION, 'There is no criterion with the provided id.')
  @ApiAppErrorResponse(ERROR_CODE.NOT_ALREADY_RATED_UEOF, 'Thrown if user has not rated the UE.')
  async unRateUe(
    @Param('ueofCode') ueofCode: string,
    @UUIDParam('criterionId') criterionId: string,
    @GetUser() user: User,
  ): Promise<UeRateResDto> {
    if (!(await this.ueService.doesUeofExist(ueofCode))) throw new AppException(ERROR_CODE.NO_SUCH_UEOF, ueofCode);
    if (!(await this.ueService.doesCriterionExist(criterionId))) throw new AppException(ERROR_CODE.NO_SUCH_CRITERION);
    if (!(await this.ueService.hasAlreadyRated(user.id, ueofCode, criterionId)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_RATED_UEOF, ueofCode, criterionId);
    return this.ueService.unRateUeof(user.id, ueofCode, criterionId);
  }

  @Get('/of/me')
  @RequireUserType('STUDENT')
  @ApiOperation({ description: 'Get the UEs of the current user.' })
  @ApiOkResponse({ type: UeOverviewResDto, isArray: true })
  async getMyUes(@GetUser() user: User, @Headers('language') language: Language): Promise<UeOverviewResDto[]> {
    return (await this.ueService.getUesOfUser(user.id)).map((ue) =>
      this.formatUeOverview(
        ue,
        [language],
        user.branchSubscriptions.map((sub) => [sub.branchOption.code, sub.branchOption.branch.code]).flat(),
      ),
    );
  }

  /** This method chooses an UEOF and displays its basic data */
  private formatUeOverview(ue: Ue, langPref: string[], branchOptionPref: string[]): UeOverviewResDto {
    const lowerCasePref = langPref.map((lang) => lang.toLocaleLowerCase());
    // Filters ueofs with ueofs that can be taken with the preferred branch options
    const availableOf = ue.ueofs.filter((ueof) =>
      branchOptionPref.some((optionPref) =>
        ueof.credits.some((credit) => credit.branchOptions.some((option) => option.code === optionPref)),
      ),
    );
    // Chooses an UEOF : the only ueof if there is only one; the one with the preferred language if there is one; the first one otherwise
    const chosenOf = availableOf.length
      ? availableOf.find((ueof) => lowerCasePref.includes(ueof.info.language))
      : (ue.ueofs.find((ueof) => lowerCasePref.includes(ueof.info.language)) ?? ue.ueofs[0]);
    return {
      code: ue.code,
      name: chosenOf.name,
      credits: chosenOf.credits.map((c) => ({
        credits: c.credits,
        category: {
          code: c.category.code,
          name: c.category.name,
        },
        branchOptions: c.branchOptions,
      })),
      info: {
        requirements: chosenOf.requirements.map((r) => r.code),
        languages: ue.ueofs.map((ueof) => ueof.info.language).uniqueValues,
        minors: ue.ueofs
          .map((ueof) => ueof.info.minors?.split(',') ?? [])
          .reduce((acc, minors) => [...acc, ...minors], []).uniqueValues,
      },
      openSemester: ue.ueofs
        .map((ueof) => ueof.openSemester)
        // Merge semesters and skip duplicates
        .reduce((acc, val) => [...acc, ...val.filter((sem) => acc.every((has) => has.code !== sem.code))], [])
        .map((semester) => ({
          code: semester.code,
          start: semester.start,
          end: semester.end,
        })),
    };
  }

  private formatDetailedUe(ue: Ue, userType: UserType): UeDetailResDto {
    return {
      code: ue.code,
      creationYear: ue.creationYear,
      updateYear: ue.updateYear,
      ueofs: ue.ueofs.map((ueof) => ({
        code: ueof.code,
        name: ueof.name,
        credits: ueof.credits.map((c) => ({
          credits: c.credits,
          category: {
            code: c.category.code,
            name: c.category.name,
          },
          branchOptions: c.branchOptions.map((branchOption) => ({
            code: branchOption.code,
            name: branchOption.name,
            branch: {
              code: branchOption.branch.code,
              name: branchOption.branch.name,
            },
          })),
        })),
        info: {
          requirements: ueof.requirements.map((r) => r.code),
          language: ueof.info.language,
          minors: ueof.info.minors?.split(',') ?? [],
          objectives: ueof.info.objectives,
          program: ueof.info.program,
        },
        openSemester: ueof.openSemester.map((semester) => ({
          code: semester.code,
          start: semester.start,
          end: semester.end,
        })),
        workTime: {
          cm: ueof.workTime.cm,
          td: ueof.workTime.td,
          tp: ueof.workTime.tp,
          the: ueof.workTime.the,
          project: ueof.workTime.project,
          internship: ueof.workTime.internship,
        },
        starVotes:
          userType === UserType.STUDENT || userType === UserType.FORMER_STUDENT
            ? {
                // Compute ratings for each criterion, using an exponential decay function
                ...Object.fromEntries(
                  Object.entries(ue.starVotes).map(([criterion, rates]) => [
                    criterion,
                    this.computeRate(rates, ueof.code),
                  ]),
                ),
                voteCount:
                  Object.values(ue.starVotes)?.length &&
                  Math.max(...Object.values(ue.starVotes).map((rates) => rates.length)),
              }
            : undefined,
      })),
    };
  }

  public computeRate(rates: UeStarVoteEntry[], targetUeofCode: string) {
    function aggregate<T>(
      entities: T[],
      mapper: (entity: T) => [key: number, value: number],
      dtModifier = 1,
      decay = 10,
      ponderationMultiplier: (entity: T) => number = () => 1,
    ) {
      let coefficients = 0;
      let ponderation = 0;
      const latestKey = Math.max(...entities.map((entity) => mapper(entity)[0]));
      for (const entity of entities) {
        const [key, value] = mapper(entity);
        const dt = (latestKey - key) / dtModifier;
        const dp = Math.exp(-dt / decay) * ponderationMultiplier(entity);
        ponderation += dp * value;
        coefficients += dp;
      }
      return Math.round((ponderation / coefficients) * 10) / 10;
    }
    // Ponderate the rates of each ueof
    const ueofRates = Object.entries(rates.groupyBy((rate) => rate.ueofCode)).map(
      ([ueofCode, rates]) =>
        [
          ueofCode,
          Number(ueofCode.slice(0, -2)) || 0,
          aggregate(rates, (ent) => [ent.createdAt.getTime(), ent.value], 1000, 10e7),
        ] as const,
    );
    // Ponderate the rates depending on the ueof
    return aggregate(
      ueofRates,
      (ent) => [ent[1], ent[2]],
      1,
      10,
      ([ueofCode]) => (ueofCode === targetUeofCode ? 2 : ueofCode.startsWith(targetUeofCode.slice(0, -3)) ? 1 : 0.5),
    );
  }
}

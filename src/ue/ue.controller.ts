import { Body, Controller, Delete, Get, Headers, Param, Put, Query } from '@nestjs/common';
import { UeSearchDto } from './dto/ue-search.dto';
import { UeService } from './ue.service';
import { GetUser, IsPublic, RequireUserType } from '../auth/decorator';
import { User } from '../users/interfaces/user.interface';
import { UUIDParam } from '../app.pipe';
import { AppException, ERROR_CODE } from '../exceptions';
import { UeRateDto } from './dto/ue-rate.dto';
import { Ue } from './interfaces/ue.interface';
import { Language, UserType } from '@prisma/client';
import { Translation } from '../prisma/types';

@Controller('ue')
export class UeController {
  constructor(readonly ueService: UeService) {}

  @Get()
  @IsPublic()
  async searchUe(
    @Headers('language') language: Language,
    @Query() queryParams: UeSearchDto,
  ): Promise<Pagination<UeOverview>> {
    const res = await this.ueService.searchUes(queryParams, language);
    return {
      ...res,
      items: res.items.map((ue) => this.formatUeOverview(ue)),
    };
  }

  @Get('/:ueCode')
  @IsPublic()
  async getUe(@Param('ueCode') ueCode: string, @GetUser() user: User): Promise<UeDetail> {
    if (!(await this.ueService.doesUeExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.formatDetailedUe(await this.ueService.getUe(ueCode.toUpperCase()), user);
  }

  @Get('/rate/criteria')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async GetRateCriteria() {
    return this.ueService.getRateCriteria();
  }

  @Get('/:ueCode/rate')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async GetRateUe(@Param('ueCode') ueCode: string, @GetUser() user: User) {
    if (!(await this.ueService.doesUeExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.ueService.getRateUe(user.id, ueCode);
  }

  @Put('/:ueCode/rate')
  @RequireUserType('STUDENT')
  async RateUe(@Param('ueCode') ueCode: string, @GetUser() user: User, @Body() dto: UeRateDto) {
    if (!(await this.ueService.doesUeExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.doesCriterionExist(dto.criterion))) throw new AppException(ERROR_CODE.NO_SUCH_CRITERION);
    if (!(await this.ueService.hasAlreadyDoneThisUe(user.id, ueCode)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    return this.ueService.doRateUe(user.id, ueCode, dto);
  }

  @Delete('/:ueCode/rate/:criterionId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async UnRateUe(
    @Param('ueCode') ueCode: string,
    @UUIDParam('criterionId') criterionId: string,
    @GetUser() user: User,
  ) {
    if (!(await this.ueService.doesUeExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.doesCriterionExist(criterionId))) throw new AppException(ERROR_CODE.NO_SUCH_CRITERION);
    if (!(await this.ueService.hasAlreadyRated(user.id, ueCode, criterionId)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_RATED_UE, ueCode, criterionId);
    return this.ueService.unRateUe(user.id, ueCode, criterionId);
  }

  @Get('/of/me')
  @RequireUserType('STUDENT')
  async getMyUes(@GetUser() user: User): Promise<UeOverview[]> {
    return (await this.ueService.getUesOfUser(user.id)).map((ue) => this.formatUeOverview(ue));
  }

  private formatUeOverview(ue: Ue): UeOverview {
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

  private formatDetailedUe(ue: Ue, user?: User): UeDetail {
    const format = {
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
    } as UeDetail;
    if (user?.userType === UserType.STUDENT || user?.userType === UserType.FORMER_STUDENT)
      format.starVotes = ue.starVotes;
    return format;
  }
}

export type UeOverview = {
  code: string;
  inscriptionCode: string;
  name: Translation;
  credits: Array<{
    credits: number;
    category: {
      code: string;
      name: string;
    };
  }>;
  branchOption: Array<{
    branch: {
      code: string;
      name: string;
    };
    code: string;
    name: string;
  }>;
  info: {
    requirements: string[];
    comment: Translation;
    degree: string;
    languages: string;
    minors: string;
    objectives: Translation;
    program: Translation;
  };
  openSemester: Array<{
    code: string;
    start: Date;
    end: Date;
  }>;
};

export type UeDetail = {
  code: string;
  inscriptionCode: string;
  name: Translation;
  credits: Array<{
    credits: number;
    category: {
      code: string;
      name: string;
    };
  }>;
  branchOption: Array<{
    branch: {
      code: string;
      name: string;
    };
    code: string;
    name: string;
  }>;
  info: {
    requirements: string[];
    comment: Translation;
    degree: string;
    languages: string;
    minors: string;
    objectives: Translation;
    program: Translation;
  };
  openSemester: Array<{
    code: string;
    start: Date;
    end: Date;
  }>;
  workTime: {
    cm: number;
    td: number;
    tp: number;
    the: number;
    project: number;
    internship: number;
  };
  starVotes?: { [criterionId: string]: number };
};

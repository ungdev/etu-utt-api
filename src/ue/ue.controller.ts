import { Body, Controller, Delete, Get, Headers, Param, Put, Query } from '@nestjs/common';
import { UESearchDto } from './dto/ue-search.dto';
import { UEService } from './ue.service';
import { GetUser, IsPublic, RequireUserType } from '../auth/decorator';
import { User } from '../users/interfaces/user.interface';
import { UUIDParam } from '../app.pipe';
import { AppException, ERROR_CODE } from '../exceptions';
import { UERateDto } from './dto/ue-rate.dto';
import { UE } from './interfaces/ue.interface';
import { Language } from '@prisma/client';
import { Translation } from '../prisma/types';

@Controller('ue')
export class UEController {
  constructor(readonly ueService: UEService) {}

  @Get()
  @IsPublic()
  async searchUE(
    @Headers('language') language: Language,
    @Query() queryParams: UESearchDto,
  ): Promise<Pagination<UEOverview>> {
    const res = await this.ueService.searchUEs(queryParams, language);
    return {
      ...res,
      items: res.items.map((ue) => this.formatUEOverview(ue)),
    };
  }

  @Get('/:ueCode')
  @IsPublic()
  async getUE(@Param('ueCode') ueCode: string): Promise<UEDetail> {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.formatDetailedUE(await this.ueService.getUE(ueCode.toUpperCase())); // TODO: remove starVotes in not student
  }

  @Get('/rate/criteria')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async GetRateCriteria() {
    return this.ueService.getRateCriteria();
  }

  @Get('/:ueCode/rate')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async GetRateUE(@Param('ueCode') ueCode: string, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.ueService.getRateUE(user.id, ueCode);
  }

  @Put('/:ueCode/rate')
  @RequireUserType('STUDENT')
  async RateUE(@Param('ueCode') ueCode: string, @GetUser() user: User, @Body() dto: UERateDto) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.doesCriterionExist(dto.criterion))) throw new AppException(ERROR_CODE.NO_SUCH_CRITERION);
    if (!(await this.ueService.hasAlreadyDoneThisUE(user.id, ueCode)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    return this.ueService.doRateUE(user.id, ueCode, dto);
  }

  @Delete('/:ueCode/rate/:criterionId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async UnRateUE(
    @Param('ueCode') ueCode: string,
    @UUIDParam('criterionId') criterionId: string,
    @GetUser() user: User,
  ) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.doesCriterionExist(criterionId))) throw new AppException(ERROR_CODE.NO_SUCH_CRITERION);
    if (!(await this.ueService.hasAlreadyRated(user.id, ueCode, criterionId)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_RATED_UE, ueCode, criterionId);
    return this.ueService.unRateUE(user.id, ueCode, criterionId);
  }

  private formatUEOverview(ue: UE): UEOverview {
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

  private formatDetailedUE(ue: UE): UEDetail {
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
      starVotes: ue.starVotes,
    };
  }
}

export type UEOverview = {
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

export type UEDetail = {
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
  starVotes: { [criterionId: string]: number };
};

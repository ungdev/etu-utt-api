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
import { omit } from 'src/utils';

@Controller('ue')
export class UeController {
  constructor(readonly ueService: UeService) {}

  @Get()
  @IsPublic()
  async searchUe(
    @GetUser() user: User,
    @Headers('language') language: Language,
    @Query() queryParams: UeSearchDto,
  ): Promise<Pagination<UeOverview>> {
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
  async getUe(@GetUser() user: User, @Param('ueCode') ueCode: string): Promise<UeDetail | Omit<UeDetail, 'starVotes'>> {
    if (!(await this.ueService.doesUeExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    const result = this.formatDetailedUe(await this.ueService.getUe(ueCode.toUpperCase()));
    if (user.userType === UserType.STUDENT || user.userType === UserType.FORMER_STUDENT) return result;
    return omit(result, 'starVotes');
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
  async getMyUes(@GetUser() user: User, @Headers('language') language: Language): Promise<UeOverview[]> {
    return (await this.ueService.getUesOfUser(user.id)).map((ue) =>
      this.formatUeOverview(
        ue,
        [language],
        user.branchSubscriptions.map((sub) => [sub.branchOption.code, sub.branchOption.branch.code]).flat(),
      ),
    );
  }

  /** This method chooses an UEOF and displays its basic data */
  private formatUeOverview(ue: Ue, langPref: string[], branchOptionPref: string[]): UeOverview {
    const lowerCasePref = langPref.map((lang) => lang.toLocaleLowerCase());
    const availableOf = ue.ueofs.filter((ueof) =>
      branchOptionPref.some((optionPref) => ueof.branchOption.some((option) => option.code === optionPref)),
    );
    const chosenOf = availableOf.length
      ? availableOf.find((ueof) => lowerCasePref.includes(ueof.info.language))
      : ue.ueofs.find((ueof) => lowerCasePref.includes(ueof.info.language)) ?? ue.ueofs[0];
    return {
      code: ue.code,
      name: chosenOf.name,
      credits: chosenOf.credits.map((c) => ({
        credits: c.credits,
        category: {
          code: c.category.code,
          name: c.category.name,
        },
      })),
      branchOption: chosenOf.branchOption.map((branchOption) => ({
        code: branchOption.code,
        name: branchOption.name,
        branch: {
          code: branchOption.branch.code,
          name: branchOption.branch.name,
        },
      })),
      info: {
        requirements: chosenOf.requirements.map((r) => r.code),
        languages: [...new Set(ue.ueofs.map((ueof) => ueof.info.language))],
        minors: chosenOf.info.minors,
        objectives: chosenOf.info.objectives,
        program: chosenOf.info.program,
      },
      openSemester: ue.ueofs
        .map((ueof) => ueof.openSemester)
        .reduce((acc, val) => [...acc, ...val.filter((sem) => acc.every((has) => has.code !== sem.code))], [])
        .map((semester) => ({
          code: semester.code,
          start: semester.start,
          end: semester.end,
        })),
    };
  }

  private formatDetailedUe(ue: Ue): UeDetail {
    return {
      code: ue.code,
      creationYear: ue.creationYear,
      updateYear: ue.updateYear,
      ofs: ue.ueofs.map((ueof) => ({
        name: ueof.name,
        credits: ueof.credits.map((c) => ({
          credits: c.credits,
          category: {
            code: c.category.code,
            name: c.category.name,
          },
        })),
        branchOption: ueof.branchOption.map((branchOption) => ({
          code: branchOption.code,
          name: branchOption.name,
          branch: {
            code: branchOption.branch.code,
            name: branchOption.branch.name,
          },
        })),
        info: {
          requirements: ueof.requirements.map((r) => r.code),
          language: ueof.info.language,
          minors: ueof.info.minors,
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
      })),
      starVotes: ue.starVotes,
    };
  }
}

export type UeOverview = {
  code: string;
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
    languages: string[];
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
  creationYear: number;
  updateYear: number;
  ofs: {
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
      language: string;
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
      project: boolean;
      internship: number;
    };
  }[];
  starVotes?: { [criterionId: string]: number };
};

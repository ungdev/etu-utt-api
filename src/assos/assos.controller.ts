import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { IsPublic } from '../auth/decorator';
import { AssosService } from './assos.service';
import { AssosSearchDto } from './dto/assos-search.dto';
import { AppException, ERROR_CODE } from '../exceptions';
import { Asso } from './interfaces/asso.interface';
import { pick } from '../utils';
import { Translation } from '../prisma/types';

type AssoOverview = {
  id: string;
  name: string;
  logo: string;
  descriptionShortTranslation: Translation;
  president: {
    role: {
      name: string;
    };
    user: {
      firstName: string;
      lastName: string;
    };
  };
};

type AssoDetail = {
  id: string;
  login: string;
  name: string;
  mail: string;
  phoneNumber: string;
  website: string;
  logo: string;
  descriptionTranslation: Translation;
  president: {
    role: {
      name: string;
    };
    user: {
      firstName: string;
      lastName: string;
    };
  };
};

@Controller('assos')
export class AssosController {
  constructor(readonly assosService: AssosService) {}

  @Get()
  @IsPublic()
  async searchAssos(@Query() queryParams: AssosSearchDto): Promise<Pagination<AssoOverview>> {
    return this.assosService.searchAssos(queryParams).then((assos) => ({
      ...assos,
      items: assos.items.map(this.formatAssoOverview),
    }));
  }

  @Get('/:assoId')
  @IsPublic()
  async getAsso(
    @Param(
      'assoId',
      new ParseUUIDPipe({ exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'assoId') }),
    )
    assoId: string,
  ): Promise<AssoDetail> {
    if (!(await this.assosService.doesAssoExist(assoId))) throw new AppException(ERROR_CODE.NO_SUCH_ASSO, assoId);
    return this.formatAssoDetail(await this.assosService.getAsso(assoId.toUpperCase()));
  }

  formatAssoOverview(asso: Asso) {
    return pick(asso, 'id', 'name', 'logo', 'president', 'descriptionShortTranslation');
  }

  formatAssoDetail(asso: Asso) {
    return pick(
      asso,
      'id',
      'login',
      'name',
      'mail',
      'phoneNumber',
      'website',
      'logo',
      'president',
      'descriptionTranslation',
    );
  }
}

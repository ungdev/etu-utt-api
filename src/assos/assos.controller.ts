import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { IsPublic } from '../auth/decorator';
import { AssosService } from './assos.service';
import AssosSearchReqDto from './dto/req/assos-search-req.dto';
import { AppException, ERROR_CODE } from '../exceptions';
import { Asso } from './interfaces/asso.interface';
import { pick } from '../utils';
import AssoOverviewResDto from './dto/res/asso-overview-res.dto';
import AssoDetailResDto from './dto/res/asso-detail-res.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAppErrorResponse, paginatedResponseDto } from '../app.dto';
import { Pagination } from '../types';

@Controller('assos')
@ApiTags('Assos')
export class AssosController {
  constructor(readonly assosService: AssosService) {}

  @Get()
  @IsPublic()
  @ApiOperation({
    description: 'Search for assos, eventually with advanced search fields. The associations returned are paginated.',
  })
  @ApiOkResponse({ type: paginatedResponseDto(AssoOverviewResDto) })
  async searchAssos(@Query() queryParams: AssosSearchReqDto): Promise<Pagination<AssoOverviewResDto>> {
    return this.assosService.searchAssos(queryParams).then((assos) => ({
      ...assos,
      items: assos.items.map(this.formatAssoOverview),
    }));
  }

  @Get('/:assoId')
  @IsPublic()
  @ApiOperation({
    description: 'Find an asso by its id.',
  })
  @ApiOkResponse({ type: AssoDetailResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  async getAsso(
    @Param(
      'assoId',
      new ParseUUIDPipe({ exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'assoId') }),
    )
    assoId: string,
  ): Promise<AssoDetailResDto> {
    if (!(await this.assosService.doesAssoExist(assoId))) throw new AppException(ERROR_CODE.NO_SUCH_ASSO, assoId);
    return this.formatAssoDetail(await this.assosService.getAsso(assoId.toUpperCase()));
  }

  formatAssoOverview(asso: Asso): AssoOverviewResDto {
    return {
      ...pick(asso, 'id', 'name', 'logo', 'president'),
      shortDescription: asso.descriptionShortTranslation,
    };
  }

  formatAssoDetail(asso: Asso): AssoDetailResDto {
    return {
      ...pick(asso, 'id', 'login', 'name', 'mail', 'phoneNumber', 'website', 'logo', 'president'),
      description: asso.descriptionTranslation,
    };
  }
}

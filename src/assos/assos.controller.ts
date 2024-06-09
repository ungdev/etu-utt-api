import {Controller, Get, Param, ParseUUIDPipe, Query} from '@nestjs/common';
import { IsPublic } from '../auth/decorator';
import { AssosService } from './assos.service';
import { AssosSearchDto } from './dto/assos-search.dto';
import { AssosOverView } from './interfaces/assos-overview.interface';
import { AssosDetail } from './interfaces/assos-detail.interface';
import { AppException, ERROR_CODE } from '../exceptions';

@Controller('assos')
export class AssosController {
  constructor(readonly assosService: AssosService) {}

  @Get()
  @IsPublic()
  async searchAssos(@Query() queryParams: AssosSearchDto): Promise<Pagination<AssosOverView>> {
    return this.assosService.searchAssos(queryParams);
  }

  @Get('/:assoId')
  @IsPublic()
  async getAsso(@Param('assoId', new ParseUUIDPipe({ exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'assoId') })) assoId: string): Promise<AssosDetail> {
    if (!(await this.assosService.doesAssoExist(assoId))) throw new AppException(ERROR_CODE.NO_SUCH_ASSO, assoId);
    return this.assosService.getAsso(assoId.toUpperCase());
  }
}

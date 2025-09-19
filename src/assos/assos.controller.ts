import { Controller, Delete, Get, Post, Put, Query } from '@nestjs/common';
import { ParamAsso } from './decorator/get-asso';
import { IsPublic } from '../auth/decorator';
import { AssosService } from './assos.service';
import { ERROR_CODE } from '../exceptions';
import { Asso } from './interfaces/asso.interface';
import { pick } from '../utils';
import AssosSearchReqDto from './dto/req/assos-search-req.dto';
import AssoOverviewResDto from './dto/res/asso-overview-res.dto';
import AssoDetailResDto from './dto/res/asso-detail-res.dto';
import AssoMembersResDto from './dto/res/asso-members-res.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAppErrorResponse, paginatedResponseDto } from '../app.dto';
import { AssoMembershipRole } from './interfaces/membership-role.interface';

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
  getAsso(@ParamAsso() asso: Asso): AssoDetailResDto {
    return this.formatAssoDetail(asso);
  }

  // The route below is not public as it exposes the full name of all members, only the president is supposed to be exposed publicly in the route above
  @Get('/:assoId/members')
  @ApiOperation({
    description: 'Get the members of an asso, with their roles.',
  })
  @ApiOkResponse({ type: AssoDetailResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  async getAssoMembers(@ParamAsso() asso: Asso): Promise<AssoMembersResDto> {
    return { roles: (await this.assosService.getAssoMembers(asso.id)).map(this.formatAssoMembershipRole) };
  }

  formatAssoOverview(asso: Asso): AssoOverviewResDto {
    return {
      ...pick(asso, 'id', 'name', 'logo', 'president'),
      shortDescription: asso.descriptionShortTranslation,
      president: {
        role: pick(asso.president.role, 'id', 'name'),
        user: !!asso.president.user ? pick(asso.president.user, 'id', 'firstName', 'lastName') : null,
      },
    };
  }

  formatAssoDetail(asso: Asso): AssoDetailResDto {
    return {
      ...pick(asso, 'id', 'name', 'mail', 'phoneNumber', 'website', 'logo'),
      description: asso.descriptionTranslation,
      president: {
        role: pick(asso.president.role, 'id', 'name'),
        user: !!asso.president.user ? pick(asso.president.user, 'id', 'firstName', 'lastName') : null,
      },
    };
  }

  formatAssoMembershipRole(members: AssoMembershipRole) {
    return {
      ...pick(members, 'id', 'name', 'position', 'isPresident'),
      members: members.assoMembership.map((membership) => pick(membership.user, 'id', 'firstName', 'lastName')),
    };
  }
}

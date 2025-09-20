import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAppErrorResponse, paginatedResponseDto } from '../app.dto';
import { AssoMembership, AssoMembershipRole } from './interfaces/membership-role.interface';
import { ParamAsso } from './decorator/get-asso';
import { GetUser, IsPublic } from '../auth/decorator';
import { AssosService } from './assos.service';
import { AppException, ERROR_CODE } from '../exceptions';
import { ParamMember } from './decorator/get-member';
import { Asso } from './interfaces/asso.interface';
import { User } from '../users/interfaces/user.interface';
import { pick } from '../utils';
import AssosSearchReqDto from './dto/req/assos-search-req.dto';
import AssoOverviewResDto from './dto/res/asso-overview-res.dto';
import AssoDetailResDto from './dto/res/asso-detail-res.dto';
import AssoMembersResDto from './dto/res/asso-members-res.dto';
import AssosRoleCreateReqDto from './dto/req/assos-role-create.dto';
import AssoRoleResDto, { AssoRoleListResDto, AssoRoleListWithMembersResDto } from './dto/res/assos-role-res.dto';
import AssosRoleUpdateReqDto from './dto/req/assos-role-update.dto';
import AssosMemberCreateReqDto from './dto/req/assos-member-create.dto';
import AssosMemberUpdateReqDto from './dto/req/assos-member-update.dto';
import AssoMembershipResDto from './dto/res/assos-membership-res.dto';
import UsersService from '../users/users.service';

@Controller('assos')
@ApiTags('Assos')
export class AssosController {
  constructor(
    readonly assosService: AssosService,
    readonly userService: UsersService,
  ) {}

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
  @ApiOkResponse({ type: AssoRoleListWithMembersResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  async getAssoMembers(@ParamAsso() asso: Asso): Promise<AssoMembersResDto> {
    return { roles: (await this.assosService.getAssoMembers(asso.id)).map(this.formatAssoMembershipRole) };
  }

  @Post('/:assoId/members')
  @ApiOperation({
    description: 'Adds a member to an asso.',
  })
  @ApiOkResponse({ type: AssoMembershipResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user has no permission to perform this action for this asso',
  )
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO_ROLE, 'There is no role with the given id in this asso')
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_USER, 'There is no user with the given id')
  @ApiAppErrorResponse(ERROR_CODE.USER_ALREADY_ASSO_ROLE_MEMBER, 'The user is already a member of this asso')
  async addAssoMember(@ParamAsso() asso: Asso, @GetUser() user: User, @Body() body: AssosMemberCreateReqDto) {
    if (!this.assosService.hasAssoPermission(asso.id, user.id, 'manage_members') && asso.president.user?.id !== user.id)
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_members');
    const role = await this.assosService.getAssoRole(body.roleId, asso.id);
    if (!role) throw new AppException(ERROR_CODE.NO_SUCH_ASSO_ROLE, asso.id);
    if (!(await this.userService.fetchUser(body.userId))) throw new AppException(ERROR_CODE.NO_SUCH_USER, body.userId);
    if (this.assosService.hasRole(role.id, body.userId))
      throw new AppException(ERROR_CODE.USER_ALREADY_ASSO_ROLE_MEMBER, role.name);
    if (!this.assosService.hasAssoPermissions(asso.id, user.id, body.permissions))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, body.permissions.join(', '));
    return this.assosService
      .addAssoMemberRole(asso.id, body.userId, role.id, body.permissions, body.endAt)
      .then(this.formatAssoMembership);
  }

  @Delete('/:assoId/members/:memberId')
  @ApiOperation({
    description: 'Kicks a member from an asso.',
  })
  @ApiOkResponse({ type: AssoMembershipResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  async kickAssoMember(@ParamAsso() asso: Asso, @ParamMember() member: AssoMembership, @GetUser() user: User) {
    if (!this.assosService.hasAssoPermission(asso.id, user.id, 'manage_members') && asso.president.user?.id !== user.id)
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_members');
    if (member.assoId !== asso.id) throw new AppException(ERROR_CODE.NO_SUCH_ASSO_MEMBERSHIP, member.id);
    return this.assosService.updateAssoMember(member.id, { endAt: new Date() }).then(this.formatAssoMembership);
  }

  @Put('/:assoId/members/:memberId')
  @ApiOperation({
    description: 'Updates roles of a member in an asso.',
  })
  @ApiOkResponse({ type: AssoMembershipResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  async updateAssoMember(
    @ParamAsso() asso: Asso,
    @ParamMember() member: AssoMembership,
    @GetUser() user: User,
    @Body() body: AssosMemberUpdateReqDto,
  ) {
    if (!this.assosService.hasAssoPermission(asso.id, user.id, 'manage_members') && asso.president.user?.id !== user.id)
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_members');
    if (member.assoId !== asso.id) throw new AppException(ERROR_CODE.NO_SUCH_ASSO_MEMBERSHIP, member.id);
    const role = await this.assosService.getAssoRole(body.roleId, asso.id);
    if (!role) throw new AppException(ERROR_CODE.NO_SUCH_ASSO_ROLE, asso.id);
    if (this.assosService.hasRole(role.id, member.userId))
      throw new AppException(ERROR_CODE.USER_ALREADY_ASSO_ROLE_MEMBER, role.name);
    if (!this.assosService.hasAssoPermissions(asso.id, user.id, body.permissions))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, body.permissions.join(', '));
    return this.assosService.updateAssoMember(member.id, body).then(this.formatAssoMembership);
  }

  @Post('/:assoId/roles')
  @ApiOperation({
    description: 'Creates a new role in an asso.',
  })
  @ApiOkResponse({ type: AssoRoleResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user has no permission to perform this action for this asso',
  )
  async createAssoRole(@ParamAsso() asso: Asso, @GetUser() user: User, @Body() body: AssosRoleCreateReqDto) {
    if (!this.assosService.hasAssoPermission(asso.id, user.id, 'manage_roles') && asso.president.user?.id !== user.id)
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_roles');
    return this.assosService.createAssoRole(asso.id, body.name).then(this.formatPartialAssoMembershipRole);
  }

  @Delete('/:assoId/roles/:roleId')
  @ApiOperation({
    description: 'Deletes a role from an asso.',
  })
  @ApiOkResponse({ type: AssoRoleResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user has no permission to perform this action for this asso',
  )
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO_ROLE, 'There is no role with the given id in this asso')
  @ApiAppErrorResponse(ERROR_CODE.FORBIDDEN_ASSOS_ROLE_PERMANENT, 'The given role is permanent and cannot be deleted')
  async deleteAssoRole(
    @ParamAsso() asso: Asso,
    @GetUser() user: User,
    @Param(
      'roleId',
      new ParseUUIDPipe({ exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'roleId') }),
    )
    roleId: string,
  ) {
    if (!this.assosService.hasAssoPermission(asso.id, user.id, 'manage_roles') && asso.president.user?.id !== user.id)
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_roles');
    const role = await this.assosService.getAssoRole(roleId, asso.id);
    if (!role) throw new AppException(ERROR_CODE.NO_SUCH_ASSO_ROLE, asso.id);
    if (role.isPresident) throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_ROLE_PERMANENT, role.name);
    return this.assosService.deleteAssoRole(role.id).then(this.formatPartialAssoMembershipRole);
  }

  @Put('/:assoId/roles/:roleId')
  @ApiOperation({
    description: 'Updates a role in an asso.',
  })
  @ApiOkResponse({ type: AssoRoleListResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user has no permission to perform this action for this asso',
  )
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO_ROLE, 'There is no role with the given id in this asso')
  async updateAssoRole(
    @ParamAsso() asso: Asso,
    @GetUser() user: User,
    @Param(
      'roleId',
      new ParseUUIDPipe({ exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'roleId') }),
    )
    roleId: string,
    @Body() body: AssosRoleUpdateReqDto,
  ) {
    if (!this.assosService.hasAssoPermission(asso.id, user.id, 'manage_roles') && asso.president.user?.id !== user.id)
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_roles');
    const role = await this.assosService.getAssoRole(roleId, asso.id);
    if (!role) throw new AppException(ERROR_CODE.NO_SUCH_ASSO_ROLE, asso.id);
    return this.assosService
      .updateAssoRole(role.id, asso.id, pick(body, 'name', 'position'), pick(role, 'name', 'position'))
      .then((data) => ({ roles: data.map(this.formatPartialAssoMembershipRole) }));
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
      members: members.assoMembership.map((membership) => ({
        id: membership.id,
        startAt: membership.startAt,
        endAt: membership.endAt,
        userid: membership.user.id,
        ...pick(membership.user, 'firstName', 'lastName'),
      })),
    };
  }

  formatPartialAssoMembershipRole(members: Partial<AssoMembershipRole>) {
    return pick(members, 'id', 'name', 'position', 'isPresident');
  }

  formatAssoMembership(member: AssoMembership): AssoMembershipResDto {
    return pick(member, 'id', 'roleId', 'userId', 'endAt');
  }
}

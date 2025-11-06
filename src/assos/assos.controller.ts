import { Body, Controller, Delete, Get, ParseDatePipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiAppErrorResponse, paginatedResponseDto } from '../app.dto';
import { AssoMembershipRole } from './interfaces/membership-role.interface';
import { AssoMembership } from './interfaces/membership.interface';
import { ParamAsso } from './decorator/get-asso';
import { GetUser, IsPublic } from '../auth/decorator';
import { AssosService } from './assos.service';
import { AppException, ERROR_CODE } from '../exceptions';
import { ParamMember } from './decorator/get-member';
import { Asso } from './interfaces/asso.interface';
import { User } from '../users/interfaces/user.interface';
import { pick } from '../utils';
import { UUIDParam } from '../app.pipe';
import AssosSearchReqDto from './dto/req/assos-search-req.dto';
import AssoOverviewResDto from './dto/res/asso-overview-res.dto';
import AssoDetailResDto from './dto/res/asso-detail-res.dto';
import AssoMembersResDto from './dto/res/asso-members-res.dto';
import AssosRoleCreateReqDto from './dto/req/assos-role-create.dto';
import AssoRoleOverviewResDto, { AssoRole, AssoRoleListResDto, AssoRoleResDto } from './dto/res/assos-role-res.dto';
import AssosRoleUpdateReqDto from './dto/req/assos-role-update.dto';
import AssosMemberCreateReqDto from './dto/req/assos-member-create.dto';
import AssosMemberUpdateReqDto from './dto/req/assos-member-update.dto';
import AssoMembershipResDto from './dto/res/assos-membership-res.dto';
import UsersService from '../users/users.service';
import AssosPostDaymailReqDto from './dto/req/assos-post-daymail-req.dto';
import DaymailResDto from './dto/res/daymail-res.dto';
import { ConfigModule } from '../config/config.module';

@Controller('assos')
@ApiTags('Assos')
export class AssosController {
  constructor(
    readonly assosService: AssosService,
    readonly userService: UsersService,
    readonly config: ConfigModule,
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
  @ApiOkResponse({ type: AssoRoleResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  async getAssoMembers(@ParamAsso() asso: Asso, @GetUser() user: User): Promise<AssoMembersResDto> {
    const showPerms = await this.assosService.hasSomeAssoPermission(asso, user.id, 'manage_members', 'manage_roles');
    return {
      roles: (await this.assosService.getAssoMembers(asso.id)).map((role) =>
        this.formatAssoMembershipRole(role, showPerms),
      ),
    };
  }

  @Post('/:assoId/members')
  @ApiOperation({
    description: 'Adds a member to an asso.',
  })
  @ApiCreatedResponse({ type: AssoMembershipResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user has no permission to perform this action for this asso',
  )
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO_ROLE, 'There is no role with the given id in this asso')
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_USER, 'There is no user with the given id')
  @ApiAppErrorResponse(ERROR_CODE.USER_ALREADY_ASSO_ROLE_MEMBER, 'The user is already a member of this asso')
  async addAssoMember(@ParamAsso() asso: Asso, @GetUser() user: User, @Body() body: AssosMemberCreateReqDto) {
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'manage_members')))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_members');
    const role = await this.assosService.getAssoRole(body.roleId, asso.id);
    if (!role) throw new AppException(ERROR_CODE.NO_SUCH_ASSO_ROLE, asso.id);
    if (!(await this.userService.fetchUser(body.userId))) throw new AppException(ERROR_CODE.NO_SUCH_USER, body.userId);
    if (await this.assosService.hasRole(role.id, body.userId))
      throw new AppException(ERROR_CODE.USER_ALREADY_ASSO_ROLE_MEMBER, role.name);
    if (!(await this.assosService.hasEveryAssoPermission(asso, user.id, ...body.permissions)))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, body.permissions.join(', '));
    return this.assosService
      .addAssoMembership(asso.id, body.userId, role.id, body.permissions, body.endAt)
      .then(this.formatAssoMembership);
  }

  @Delete('/:assoId/members/:memberId')
  @ApiOperation({
    description: 'Kicks a member from an asso.',
  })
  @ApiOkResponse({ type: AssoMembershipResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO_MEMBERSHIP, 'There is no membership with the given id')
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user has no permission to perform this action for this asso',
  )
  async kickAssoMember(@ParamAsso() asso: Asso, @ParamMember() member: AssoMembership, @GetUser() user: User) {
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'manage_members')))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_members');
    if (member.assoId !== asso.id || member.endAt < new Date())
      throw new AppException(ERROR_CODE.NO_SUCH_ASSO_MEMBERSHIP, member.id);
    return this.assosService.updateAssoMember(member.id, { endAt: new Date() }).then(this.formatAssoMembership);
  }

  @Patch('/:assoId/members/:memberId')
  @ApiOperation({
    description: 'Updates roles of a member in an asso.',
  })
  @ApiOkResponse({ type: AssoMembershipResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO_MEMBERSHIP, 'There is no membership with the given id')
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user has no permission to perform this action for this asso',
  )
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO_ROLE, 'There is no role with the given id in this asso')
  @ApiAppErrorResponse(ERROR_CODE.USER_ALREADY_ASSO_ROLE_MEMBER, 'The user is already a member of this asso')
  async updateAssoMember(
    @ParamAsso() asso: Asso,
    @ParamMember() member: AssoMembership,
    @GetUser() user: User,
    @Body() body: AssosMemberUpdateReqDto,
  ) {
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'manage_members')))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_members');
    if (member.assoId !== asso.id) throw new AppException(ERROR_CODE.NO_SUCH_ASSO_MEMBERSHIP, member.id);
    if (body.roleId) {
      const role = await this.assosService.getAssoRole(body.roleId, asso.id);
      if (!role) throw new AppException(ERROR_CODE.NO_SUCH_ASSO_ROLE, asso.id);
      if (await this.assosService.hasRole(role.id, member.userId))
        throw new AppException(ERROR_CODE.USER_ALREADY_ASSO_ROLE_MEMBER, role.name);
    }
    if (body.permissions && !(await this.assosService.hasEveryAssoPermission(asso, user.id, ...body.permissions)))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, body.permissions.join(', '));
    return this.assosService.updateAssoMember(member.id, body).then(this.formatAssoMembership);
  }

  @Post('/:assoId/roles')
  @ApiOperation({
    description: 'Creates a new role in an asso.',
  })
  @ApiOkResponse({ type: AssoRoleOverviewResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user has no permission to perform this action for this asso',
  )
  async createAssoRole(@ParamAsso() asso: Asso, @GetUser() user: User, @Body() body: AssosRoleCreateReqDto) {
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'manage_roles')))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_roles');
    return this.assosService.createAssoRole(asso.id, body.name).then(this.formatPartialAssoMembershipRole);
  }

  @Delete('/:assoId/roles/:roleId')
  @ApiOperation({
    description: 'Deletes a role from an asso. Caution: all members with this role will lose it.',
  })
  @ApiOkResponse({ type: AssoRoleOverviewResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO, 'There is no asso with the given id')
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user has no permission to perform this action for this asso',
  )
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO_ROLE, 'There is no role with the given id in this asso')
  @ApiAppErrorResponse(ERROR_CODE.FORBIDDEN_ASSOS_ROLE_PERMANENT, 'The given role is permanent and cannot be deleted')
  async deleteAssoRole(@ParamAsso() asso: Asso, @GetUser() user: User, @UUIDParam('roleId') roleId: string) {
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'manage_roles')))
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
    @UUIDParam('roleId') roleId: string,
    @Body() body: AssosRoleUpdateReqDto,
  ) {
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'manage_roles')))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_roles');
    const role = await this.assosService.getAssoRole(roleId, asso.id);
    if (!role) throw new AppException(ERROR_CODE.NO_SUCH_ASSO_ROLE, asso.id);
    if (body.position > (await this.assosService.getRoleRange(asso.id)))
      throw new AppException(ERROR_CODE.PARAM_TOO_HIGH, 'position');
    const updatedRoles = await this.assosService.updateAssoRole(role.id, asso.id, pick(body, 'name', 'position'));
    return { roles: updatedRoles.map(this.formatPartialAssoMembershipRole) };
  }

  @Get('/:assoId/daymail')
  @ApiOperation({ description: 'Get daymails from query parameter `from` to query parameter `to`.' })
  @ApiQuery({ name: 'from', type: String, default: 'Today' })
  @ApiQuery({ name: 'to', type: String, default: `\`from\` + env.PAGINATION_PAGE_SIZE days` })
  @ApiOkResponse({ type: DaymailResDto, isArray: true })
  @ApiAppErrorResponse(ERROR_CODE.TOO_MANY_DAYS, "API can't return more than env.PAGINATION_PAGE_SIZE days of daymail")
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user issuing the request does not have the permission manage_asso',
  )
  async getPlannedDaymails(
    @ParamAsso() asso: Asso,
    @Query('from', new ParseDatePipe({ optional: true })) from: Date,
    @Query('to', new ParseDatePipe({ optional: true })) to: Date,
    @GetUser() user: User,
  ): Promise<DaymailResDto[]> {
    if (!from) from = new Date();
    from = from.dropTime();
    to = to ? to.dropTime() : from.add({ days: this.config.PAGINATION_PAGE_SIZE - 1 });
    if (from > to) throw new AppException(ERROR_CODE.PARAM_DATE_MUST_BE_AFTER, to.toISOString(), from.toISOString());
    const daysCount = Math.floor((to.getTime() - from.getTime()) / (1000 * 3600 * 24)) + 1; // Add 1 to include both `from` and `to`
    if (daysCount > this.config.PAGINATION_PAGE_SIZE)
      throw new AppException(ERROR_CODE.TOO_MANY_DAYS, `${daysCount}`, `${this.config.PAGINATION_PAGE_SIZE}`);
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'manage_asso')))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_asso');
    return (await this.assosService.getDaymails(asso.id, from, to)).mappedSort((daymail) => [daymail.sendDates[0]]);
  }

  @Post('/:assoId/daymail')
  @ApiOperation({ description: 'Create a daymail for the given association.' })
  @ApiCreatedResponse({ type: DaymailResDto })
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user issuing the request does not have the permission manage_asso',
  )
  async createDaymail(
    @ParamAsso() asso: Asso,
    @Body() dto: AssosPostDaymailReqDto,
    @GetUser() user: User,
  ): Promise<DaymailResDto> {
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'manage_asso')))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_asso');
    return this.assosService.addDaymail(asso.id, dto.title, dto.message, dto.dates);
  }

  @Patch('/:assoId/daymail/:daymailId')
  @ApiOperation({ description: 'Update a daymail for the given association.' })
  @ApiOkResponse({ type: DaymailResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ASSO)
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_DAYMAIL)
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user issuing the request does not have the permission manage_asso',
  )
  async updateDaymail(
    @ParamAsso() asso: Asso,
    @UUIDParam('daymailId') daymailId,
    @Body() dto: AssosPostDaymailReqDto,
    @GetUser() user: User,
  ): Promise<DaymailResDto> {
    if (!(await this.assosService.doesDaymailExist(daymailId, asso.id)))
      throw new AppException(ERROR_CODE.NO_SUCH_DAYMAIL, daymailId);
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'manage_asso')))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_asso');
    return this.assosService.updateDaymail(daymailId, pick(dto, 'title', 'message', 'dates'));
  }

  @Delete('/:assoId/daymail/:daymailId')
  @ApiOperation({ description: 'Delete a daymail for the given association.' })
  @ApiOkResponse({ type: DaymailResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_DAYMAIL)
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
    'The user issuing the request does not have the permission manage_asso',
  )
  async deleteDaymail(@ParamAsso() asso: Asso, @UUIDParam('daymailId') daymailId, @GetUser() user: User): Promise<DaymailResDto> {
    if (!(await this.assosService.doesDaymailExist(daymailId, asso.id)))
      throw new AppException(ERROR_CODE.NO_SUCH_DAYMAIL, daymailId);
    if (!(await this.assosService.hasSomeAssoPermission(asso, user.id, 'manage_asso')))
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_asso');
    return this.assosService.deleteDaymail(daymailId);
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

  formatAssoMembershipRole(members: AssoMembershipRole, includePermissions = false): AssoRole {
    return {
      ...pick(members, 'id', 'name', 'position', 'isPresident'),
      members: members.assoMemberships.map((membership) => ({
        id: membership.id,
        startAt: membership.startAt,
        endAt: membership.endAt,
        userId: membership.user.id,
        permissions: includePermissions ? membership.permissions.map((p) => p.id) : [],
        ...pick(membership.user, 'firstName', 'lastName'),
      })),
    };
  }

  formatPartialAssoMembershipRole(members: Partial<AssoMembershipRole>) {
    return pick(members, 'id', 'name', 'position', 'isPresident');
  }

  formatAssoMembership(member: AssoMembership): AssoMembershipResDto {
    return pick(member, 'id', 'roleId', 'userId', 'endAt', 'startAt');
  }
}

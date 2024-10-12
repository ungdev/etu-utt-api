import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import UsersSearchReqDto from './dto/req/users-search-req.dto';
import { UserUpdateReqDto } from './dto/req/users-update-req.dto';
import { GetUser } from '../auth/decorator';
import { User } from './interfaces/user.interface';
import UsersService from './users.service';
import { AppException, ERROR_CODE } from '../exceptions';
import { pick } from '../utils';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import UserOverviewResDto from './dto/res/user-overview-res.dto';
import { ApiAppErrorResponse, paginatedResponseDto } from '../app.dto';
import UserDetailResDto from './dto/res/user-detail-res.dto';
import UserBirthdayResDto from './dto/res/user-birthday-res.dto';
import UserAssoMembershipResDto from './dto/res/user-asso-membership-res.dto';

@Controller('users')
@ApiTags('User')
export default class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({
    description: 'Searches for user, eventually with advanced search fields. The users returned are paginated.',
  })
  @ApiOkResponse({ type: paginatedResponseDto(UserOverviewResDto) })
  async searchUser(@Query() queryParams: UsersSearchReqDto): Promise<Pagination<UserOverviewResDto>> {
    const users = await this.usersService.searchUsers(queryParams);
    const formattedReturn = users.items.map((user) => this.formatUserPreview(user, false));
    return { ...users, items: formattedReturn };
  }

  @Get('/current')
  @ApiOperation({ description: 'Returns the details of the currently logged in user.' })
  @ApiOkResponse({ type: UserDetailResDto })
  async getCurrentUser(@GetUser() user: User): Promise<UserDetailResDto> {
    return this.formatUserDetails(user, true);
  }

  @Get('/:userId')
  @ApiOperation({
    description:
      'Returns the details of the user with the given id. Private details are hidden if currently logged in user does not have the permissions to access them.',
  })
  @ApiOkResponse({ type: UserDetailResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_USER, 'There is no user with the given userId.')
  async getSingleUser(@GetUser() user: User, @Param('userId') userId: string): Promise<UserDetailResDto> {
    const userToFind = await this.usersService.fetchUser(userId);
    if (!userToFind) {
      throw new AppException(ERROR_CODE.NO_SUCH_USER, userId);
    }
    return this.formatUserDetails(userToFind, user.id === userId);
  }

  @Get('/:userId/associations')
  @ApiOperation({
    description:
      'Get the associations in which the user is, along with his roles, for how long he has been a member, ...',
  })
  @ApiOkResponse({ type: UserAssoMembershipResDto, isArray: true })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_USER, 'There is no user with the given userId.')
  async getUserAssociations(@Param('userId') userId: string): Promise<UserAssoMembershipResDto[]> {
    const user = await this.usersService.fetchUser(userId);
    if (!user) {
      throw new AppException(ERROR_CODE.NO_SUCH_USER, userId);
    }
    const assos = await this.usersService.fetchUserAssoMemberships(userId);
    return assos.map((membership) => ({
      ...pick(membership, 'role', 'startAt', 'endAt'),
      asso: {
        ...pick(membership.asso, 'name', 'logo', 'mail'),
        shortDescription: membership.asso.descriptionShortTranslation,
      },
    }));
  }

  @Patch('/current')
  @ApiOperation({ description: 'Modifies the user currently connected.' })
  @ApiOkResponse({ type: UserDetailResDto })
  @ApiAppErrorResponse(
    ERROR_CODE.NO_FIELD_PROVIDED,
    'Occurs when the body is empty, ie when nothing should be updated.',
  )
  async updateInfos(@GetUser() user: User, @Body() dto: UserUpdateReqDto): Promise<UserDetailResDto> {
    if (Object.values(dto).every((element) => element === undefined))
      throw new AppException(ERROR_CODE.NO_FIELD_PROVIDED);
    await this.usersService.updateUserProfil(user.id, dto);
    return this.formatUserDetails(await this.usersService.fetchUser(user.id), true);
  }

  @Get('/birthdays/today')
  @ApiOperation({
    description:
      'Get the birthdays of the current day. Only users who accepted to share their birthday with others will be sent back.',
  })
  @ApiOkResponse({ type: UserBirthdayResDto, isArray: true })
  async getTodaysBirthdays(): Promise<UserBirthdayResDto[]> {
    return (await this.usersService.getBirthdayOfDay(new Date())).map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.infos.nickname,
      age: new Date(Date.now() - user.infos.birthday.getTime()).getUTCFullYear() - 1970,
    }));
  }

  private formatUserPreview(user: User, includeAll: boolean): UserOverviewResDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      login: user.login,
      studentId: user.studentId,
      userType: user.userType,
      infos: {
        ...pick(user.infos, 'nickname', 'avatar', 'nationality', 'passions', 'website'),
        sex: user.privacy.sex || includeAll ? user.infos.sex : undefined,
        birthday: user.privacy.birthday || includeAll ? user.infos.birthday : undefined,
      },
      branchSubscriptions: user.branchSubscriptions.map((branch) => branch.branchOption.code),
      mailsPhones: {
        ...pick(user.mailsPhones, 'mailUTT'),
        mailPersonal: user.privacy.mailPersonal || includeAll ? user.mailsPhones.mailPersonal : undefined,
        phoneNumber: user.privacy.phoneNumber || includeAll ? user.mailsPhones.phoneNumber : undefined,
      },
      socialNetwork: {
        facebook: user.socialNetwork.facebook,
        twitter: user.socialNetwork.twitter,
        instagram: user.socialNetwork.instagram,
        linkedin: user.socialNetwork.linkedin,
        twitch: user.socialNetwork.twitch,
        spotify: user.socialNetwork.spotify,
        discord: user.privacy.discord || includeAll ? user.socialNetwork.discord : undefined,
      },
      addresses:
        user.privacy.address === 'ALL_PUBLIC' || includeAll
          ? user.addresses.map((address) => ({
              street: address.street,
              postalCode: address.postalCode,
              city: address.city,
              country: address.country,
            }))
          : [],
      permissions: Object.values(user.permissions)
        .map((apiKeyPermissions) =>
          Object.keys(apiKeyPermissions).filter((permission) => apiKeyPermissions[permission] === '*'),
        )
        .flat()
        .unique(),
    };
  }

  formatUserDetails(user: User, includeAll: boolean): UserDetailResDto {
    const branch = user.branchSubscriptions.find(
      (subscription) => subscription.semester.start >= new Date() && subscription.semester.end <= new Date(),
    );
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.infos.nickname,
      type: user.userType,
      avatar: user.infos.avatar,
      sex: user.privacy.sex || includeAll ? user.infos.sex : undefined,
      nationality: user.infos.nationality,
      birthday: user.privacy.birthday || includeAll ? user.infos.birthday : undefined,
      passions: user.infos.passions,
      website: user.infos.website,
      branch: branch?.branchOption.branch.code ?? undefined,
      semester: branch?.semesterNumber ?? undefined,
      branchOption: branch?.branchOption.code ?? undefined,
      mailUTT: user.mailsPhones === null ? undefined : user.mailsPhones.mailUTT,
      mailPersonal:
        (user.privacy.mailPersonal || includeAll) && user.mailsPhones !== null
          ? user.mailsPhones.mailPersonal
          : undefined,
      phone:
        (user.privacy.phoneNumber || includeAll) && user.mailsPhones !== null
          ? user.mailsPhones.phoneNumber
          : undefined,
      addresses:
        user.privacy.address === 'ALL_PUBLIC' || includeAll
          ? user.addresses.map((address) => ({
              street: address.street,
              postalCode: address.postalCode,
              city: address.city,
              country: address.country,
            }))
          : [],
      facebook: user.socialNetwork === null ? undefined : user.socialNetwork.facebook,
      twitter: user.socialNetwork === null ? undefined : user.socialNetwork.twitter,
      instagram: user.socialNetwork === null ? undefined : user.socialNetwork.instagram,
      linkedin: user.socialNetwork === null ? undefined : user.socialNetwork.linkedin,
      twitch: user.socialNetwork === null ? undefined : user.socialNetwork.twitch,
      spotify: user.socialNetwork === null ? undefined : user.socialNetwork.spotify,
      discord:
        (user.privacy.discord || includeAll) && user.socialNetwork !== null ? user.socialNetwork.discord : undefined,
      infoDisplayed: includeAll
        ? {
            displayBirthday: user.privacy.birthday,
            displayMailPersonal: user.privacy.mailPersonal,
            displayPhone: user.privacy.phoneNumber,
            displayAddress: user.privacy.address,
            displaySex: user.privacy.sex,
            displayDiscord: user.privacy.discord,
            displayTimetable: user.privacy.timetable,
          }
        : undefined,
    };
  }
}

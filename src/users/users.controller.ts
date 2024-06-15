import { Controller, Get, Body, BadRequestException, Param, Patch, Query } from '@nestjs/common';
import UsersSearchDto from './dto/users-search.dto';
import { UserUpdateDto } from './dto/users-update.dto';
import { GetUser } from '../auth/decorator';
import { User } from './interfaces/user.interface';
import UsersService from './users.service';
import { AppException, ERROR_CODE } from '../exceptions';
import { pick } from '../utils';

@Controller('users')
export default class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async searchUser(@Query() queryParams: UsersSearchDto) {
    const users = await this.usersService.searchUsers(queryParams);
    const formattedReturn = users.items.map((user) => this.formatUserPreview(user, false));
    return {...users, items: formattedReturn};
  }

  @Get('/current')
  async getCurrentUser(@GetUser() user: User) {
    return this.getSingleUser(user, user.id);
  }

  @Get('/:userId')
  async getSingleUser(@GetUser() user: User, @Param('userId') userId: string) {
    const userToFind = await this.usersService.fetchUser(userId);
    if (!userToFind) {
      throw new AppException(ERROR_CODE.NO_SUCH_USER, userId);
    }
    return this.formatUserDetails(userToFind, user.id === userId);
  }

  @Get('/:userId/associations')
  async getUserAssociations(@Param('userId') userId: string) {
    const user = await this.usersService.fetchUser(userId);
    if (!user) {
      throw new AppException(ERROR_CODE.NO_SUCH_USER, userId);
    }
    const assos = await this.usersService.fetchUserAssoMemberships(userId);
    return assos;
  }

  @Patch('/current')
  async updateInfos(@GetUser() user: User, @Body() dto: UserUpdateDto) {
    if (Object.values(dto).every((element) => element === undefined))
      throw new BadRequestException('You must provide at least one field to update');
    await this.usersService.updateUserProfil(user.id, dto);
    return this.formatUserDetails(await this.usersService.fetchUser(user.id), true);
  }

  @Get('/birthdays/today')
  async getTodaysBirthdays() {
    return (await this.usersService.getBirthdayOfDay(new Date())).map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.infos.nickname,
      age: new Date(Date.now() - user.infos.birthday.getTime()).getUTCFullYear() - 1970,
    }));
  }

  private formatUserPreview(user: User, includeAll: boolean) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      login: user.login,
      studentId: user.studentId,
      permissions: user.permissions,
      userType: user.userType,
      infos: {
        ...pick(user.infos, 'nickname', 'avatar', 'nationality', 'passions', 'website'),
        sex: user.privacy.sex || includeAll ? user.infos.sex : undefined,
        birthday: user.privacy.birthday || includeAll ? user.infos.birthday : undefined,
      },
      branchSubscriptions: user.branchSubscriptions.map((branch) => branch.branchOption.code),
      mailsPhones: {
        ...pick(user.mailsPhones, 'mailUTT'),
        mailPersonal:
          user.privacy.mailPersonal || includeAll
            ? user.mailsPhones.mailPersonal
            : undefined,
        phoneNumber:
          user.privacy.phoneNumber || includeAll
            ? user.mailsPhones.phoneNumber
            : undefined,
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
    };
  }

  formatUserDetails(user: User, includeAll: boolean) {
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
        (user.privacy.discord || includeAll) && user.socialNetwork !== null
          ? user.socialNetwork.discord
          : undefined,
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

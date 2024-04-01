import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserAssoMembership } from './interfaces/user.interface';
import UsersSearchDto from './dto/users-search.dto';
import { UserUpdateDto } from './dto/users-update.dto';
import { omit } from '../utils';
import { ConfigModule } from '../config/config.module';
import { Prisma } from '@prisma/client';

@Injectable()
export default class UsersService {
  constructor(private prisma: PrismaService, readonly config: ConfigModule) {}

  async searchUsers(dto: UsersSearchDto) {
    const where = {
      firstName: dto.firstName ? { contains: dto.firstName } : undefined,
      lastName: dto.lastName ? { contains: dto.lastName } : undefined,
      studentId: dto.studentId ?? undefined,
      infos: {
        nickname: dto.nickname ? { contains: dto.nickname } : undefined,
      },
      mailsPhones: {
        OR: [
          { mailUTT: dto.mail ? { contains: dto.mail } : undefined },
          { mailPersonal: dto.mail ? { contains: dto.mail } : undefined },
        ],
        phoneNumber: dto.phone ? { contains: dto.phone } : undefined,
      },
      branch: {
        semesterNumber: dto.semesterNumber,
        branch: {
          code: { contains: dto.branchCode },
        },
        branchOption: {
          code: { contains: dto.branchOptionCode },
        },
      },
      ...(dto.q
        ? {
            OR: [
              { firstName: { contains: dto.q } },
              { lastName: { contains: dto.q } },
              { infos: { nickname: { contains: dto.q } } },
              {
                mailsPhones: {
                  mailUTT: { contains: dto.q },
                  mailPersonal: { contains: dto.q },
                  phoneNumber: { contains: dto.q },
                },
              },
            ],
          }
        : {}),
    } satisfies Prisma.UserWhereInput;
    const items = await this.prisma.user.findMany({
      where,
      take: this.config.PAGINATION_PAGE_SIZE,
      skip: ((dto.page ?? 1) - 1) * this.config.PAGINATION_PAGE_SIZE,
    });
    const itemCount = await this.prisma.user.count({ where });
    return {
      items,
      itemCount,
      itemsPerPage: this.config.PAGINATION_PAGE_SIZE,
    };
  }

  fetchUser(userId: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async fetchWholeUser(userId: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async doesUserExist(search: { id?: string; login?: string }): Promise<boolean> {
    return (await this.prisma.user.count({ where: search })) > 0;
  }

  filterInfo(user: User, isCurrentUser: boolean) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.infos.nickname,
      avatar: user.infos.avatar,
      sex: user.preference.displaySex || isCurrentUser ? user.infos.sex : undefined,
      nationality: user.infos.nationality,
      birthday: user.preference.displayBirthday || isCurrentUser ? user.infos.birthday : undefined,
      passions: user.infos.passions,
      website: user.infos.website,
      branch: user.branch === null ? undefined : user.branch.branch.code,
      semester: user.branch === null ? undefined : user.branch.semesterNumber,
      branchOption: user.branch === null ? undefined : user.branch.branchOption.code,
      mailUTT: user.mailsPhones === null ? undefined : user.mailsPhones.mailUTT,
      mailPersonal:
        (user.preference.displayMailPersonal || isCurrentUser) && user.mailsPhones !== null
          ? user.mailsPhones.mailPersonal
          : undefined,
      phone:
        (user.preference.displayPhone || isCurrentUser) && user.mailsPhones !== null
          ? user.mailsPhones.phoneNumber
          : undefined,
      street:
        (user.preference.displayAddresse || isCurrentUser) && user.addresse !== null ? user.addresse.street : undefined,
      postalCode:
        (user.preference.displayAddresse || isCurrentUser) && user.addresse !== null
          ? user.addresse.postalCode
          : undefined,
      city:
        (user.preference.displayAddresse || isCurrentUser) && user.addresse !== null ? user.addresse.city : undefined,
      country:
        (user.preference.displayAddresse || isCurrentUser) && user.addresse !== null
          ? user.addresse.country
          : undefined,
      facebook: user.socialNetwork === null ? undefined : user.socialNetwork.facebook,
      twitter: user.socialNetwork === null ? undefined : user.socialNetwork.twitter,
      instagram: user.socialNetwork === null ? undefined : user.socialNetwork.instagram,
      linkedin: user.socialNetwork === null ? undefined : user.socialNetwork.linkedin,
      twitch: user.socialNetwork === null ? undefined : user.socialNetwork.twitch,
      spotify: user.socialNetwork === null ? undefined : user.socialNetwork.spotify,
      discord:
        (user.preference.displayDiscord || isCurrentUser) && user.socialNetwork !== null
          ? user.socialNetwork.pseudoDiscord
          : undefined,
      infoDisplayed: isCurrentUser
        ? {
            displayBirthday: user.preference.displayBirthday,
            displayMailPersonal: user.preference.displayMailPersonal,
            displayPhone: user.preference.displayPhone,
            displayAddress: user.preference.displayAddresse,
            displaySex: user.preference.displaySex,
            displayDiscord: user.preference.displayDiscord,
            displayTimetable: user.preference.displayTimetable,
          }
        : undefined,
    };
  }

  async fetchUserAssociation(userId: string): Promise<UserAssoMembership[]> {
    const membership = (
      await this.prisma.assoMembership.findMany({
        where: { userId: userId },
        select: {
          startAt: true,
          endAt: true,
          role: {
            select: {
              role: true,
            },
          },
          asso: {
            select: {
              name: true,
              logo: true,
              descriptionShortTranslationId: true,
              mail: true,
            },
          },
        },
      })
    ).map((membership) => ({ ...omit(membership, 'role'), role: membership.role.role }));
    return membership;
  }

  async updateUserProfil(userId: string, dto: UserUpdateDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        infos: {
          update: {
            nickname: dto.nickname,
            avatar: dto.avatar,
            passions: dto.passions,
            website: dto.website,
          },
        },
        mailsPhones: {
          update: {
            mailPersonal: dto.mailPersonal,
            phoneNumber: dto.phone,
          },
        },
        addresse: {
          update: {
            street: dto.street,
            postalCode: dto.postalCode,
            city: dto.city,
            country: dto.country,
          },
        },
        socialNetwork: {
          update: {
            facebook: dto.facebook,
            twitter: dto.twitter,
            instagram: dto.instagram,
            linkedin: dto.linkedin,
            twitch: dto.twitch,
            spotify: dto.spotify,
            pseudoDiscord: dto.pseudoDiscord,
            wantDiscordUTT: dto.wantDiscordUTT,
          },
        },
        preference: {
          update: {
            displayBirthday: dto.displayBirthday,
            displayMailPersonal: dto.displayMailPersonal,
            displayPhone: dto.displayPhone,
            displayAddresse: dto.displayAddresse,
            displaySex: dto.displaySex,
            displayDiscord: dto.displayDiscord,
            displayTimetable: dto.displayTimetable,
          },
        },
      },
    } as const);
  }
}

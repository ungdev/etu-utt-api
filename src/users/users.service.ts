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
      mailsPhones: dto.mail
        ? {
            OR: [{ mailUTT: { contains: dto.mail } }, { mailPersonal: { contains: dto.mail } }],
            phoneNumber: dto.phone ? { contains: dto.phone } : undefined,
          }
        : {},
      branchSubscriptions:
        dto.semesterNumber || dto.branchCode || dto.branchOptionCode
          ? {
              some: {
                semesterNumber: dto.semesterNumber ?? undefined,
                branchOption: dto.branchOptionCode
                  ? {
                      code: { contains: dto.branchOptionCode },
                      branch: dto.branchCode ? { code: { contains: dto.branchCode } } : undefined,
                    }
                  : undefined,
                semester: {
                  start: { gte: new Date() },
                  end: { lte: new Date() },
                },
              },
            }
          : undefined,
      privacy: {
        phoneNumber: dto.phone ? { equals: true } : undefined,
        mailPersonal: dto.mail ? { equals: true } : undefined,
      },
      ...(dto.q
        ? {
            OR: [
              { firstName: { contains: dto.q } },
              { lastName: { contains: dto.q } },
              { infos: { nickname: { contains: dto.q } } },
              {
                mailsPhones: {
                  OR: [
                    { mailUTT: { contains: dto.q } },
                    { mailPersonal: { contains: dto.q } },
                    { phoneNumber: { contains: dto.q } },
                  ],
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

  async doesUserExist(search: { id?: string; login?: string }): Promise<boolean> {
    return (await this.prisma.user.count({ where: search })) > 0;
  }

  async getBirthdayOfDay(date: Date): Promise<User[]> {
    // We can't filter by day / month directly in classic calls, we need to use raw SQL.
    const userIds = (await this.prisma.$queryRaw`
        SELECT id
        FROM UserInfos
        WHERE EXTRACT(DAY FROM birthday) = ${date.getUTCDate()}
          AND EXTRACT(MONTH FROM birthday) = ${date.getUTCMonth() + 1}`) as Array<{ id: string }>;
    return this.prisma.user.findMany({ where: { infosId: { in: userIds.map((u) => u.id) } } });
  }

  async fetchUserAssoMemberships(userId: string): Promise<UserAssoMembership[]> {
    const membership = (
      await this.prisma.assoMembership.findMany({
        where: { userId: userId },
        select: {
          startAt: true,
          endAt: true,
          role: {
            select: {
              name: true,
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
    ).map((membership) => ({ ...omit(membership, 'role'), role: membership.role.name }));
    return membership;
  }

  async updateUserProfil(userId: string, dto: UserUpdateDto): Promise<User> {
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
        addresses: dto.addresses
          ? {
              deleteMany: {},
              createMany: {
                data: dto.addresses.map((address) => ({
                  postalCode: address.postalCode,
                  city: address.city,
                  country: address.country,
                  street: address.street,
                })),
              },
            }
          : undefined,
        socialNetwork: {
          update: {
            facebook: dto.facebook,
            twitter: dto.twitter,
            instagram: dto.instagram,
            linkedin: dto.linkedin,
            twitch: dto.twitch,
            spotify: dto.spotify,
            discord: dto.discord,
          },
        },
        preference: {
          update: {
            language: dto.language,
            wantDaymail: dto.wantDaymail,
            wantDayNotif: dto.wantDayNotif,
            wantDiscordUtt: dto.wantDiscordUtt,
          },
        },
        privacy: {
          update: {
            birthday: dto.displayBirthday,
            mailPersonal: dto.displayMailPersonal,
            phoneNumber: dto.displayPhone,
            address: dto.displayAddress,
            sex: dto.displaySex,
            discord: dto.displayDiscord,
            timetable: dto.displayTimetable,
          },
        },
      },
    } as const);
  }
}

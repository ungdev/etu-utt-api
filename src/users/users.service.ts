import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SelectUser, User } from './interfaces/user.interface';
import { UsersSearchDto } from './dto/users-search.dto';

@Injectable()
export default class UsersService {
  constructor(private prisma: PrismaService) {}

  async searchUsers(dto: UsersSearchDto) {
    return this.prisma.user.findMany({
      where: {
        AND: [
          {
            firstName: {
              contains: dto.firstName,
            },
          },
          {
            lastName: {
              contains: dto.lastName,
            },
          },
          {
            infos: {
              nickname: {
                contains: dto.nickname,
              },
            },
          },
          {
            OR: [
              {
                firstName: {
                  contains: dto.name,
                },
              },
              {
                lastName: {
                  contains: dto.name,
                },
              },
              {
                infos: {
                  nickname: {
                    contains: dto.name,
                  },
                },
              },
            ],
          },
        ],
      },
      include: { infos: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async fetchUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { infos: true, permissions: true },
    });
    if (!user) return null;
    const transformedUser: User = { ...user, permissions: undefined };
    transformedUser.permissions = user.permissions.map((permission) => permission.userPermissionId);
    return transformedUser;
  }

  async doesUserExist(search: { id?: string; login?: string }): Promise<boolean> {
    return (await this.prisma.user.count({ where: search })) > 0;
  }

  filterPublicInfo(user: User) {
    return {
      id: user.id,
      studentId: user.studentId,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.infos.nickname,
      sex: user.infos.sex,
    };
  }

  async getBirthdayOfDay(date: Date): Promise<User[]> {
    // We can't filter by day / month directly in classic calls, we need to use raw SQL.
    const userIds = (await this.prisma.$queryRaw`
        SELECT userId
        FROM UserInfos
        WHERE EXTRACT(DAY FROM birthday) = ${date.getUTCDate()}
          AND EXTRACT(MONTH FROM birthday) = ${date.getUTCMonth() + 1}`) as Array<{ userId: string }>;
    const users = await this.prisma.user.findMany(SelectUser({ where: { id: { in: userIds.map((u) => u.userId) } } }));
    return users.map((user) => ({ ...user, permissions: user.permissions.map((permission) => permission.id) }));
  }
}

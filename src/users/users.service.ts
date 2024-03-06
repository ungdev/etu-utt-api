import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, formatUser, SelectUser } from './interfaces/user.interface';
import { UsersSearchDto } from './dto/users-search.dto';
import { ProfileUpdateDto } from '../profile/dto/profile-update.dto';

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
    return formatUser(user);
  }

  updateUser(userId: string, dto: ProfileUpdateDto): Promise<User> {
    return formatUser(
      this.prisma.user.update(
        SelectUser({
          where: { id: userId },
          data: { infos: { update: { nickname: dto.nickname, website: dto.website, passions: dto.passions } } },
        }),
      ),
    );
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
}

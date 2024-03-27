import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from './interfaces/user.interface';
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
    });
  }

  fetchUser(userId: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  updateUser(userId: string, dto: ProfileUpdateDto): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { infos: { update: { nickname: dto.nickname, website: dto.website, passions: dto.passions } } },
    });
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
}

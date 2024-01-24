import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../users/interfaces/user.interface';
import { ProfileUpdateDto } from './dto/profile-update.dto';
import { AppException, ERROR_CODE } from "../exceptions";

@Controller('profile')
export class ProfileController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getProfile(@GetUser() user: User) {
    return {
      id: user.id,
      login: user.login,
      firstName: user.firstName,
      lastName: user.lastName,
      studentId: user.studentId,
      sex: user.infos.sex,
      nickname: user.infos.nickname,
      passions: user.infos.passions,
      website: user.infos.website,
      birthday: user.infos.birthday,
    };
  }

  @Post()
  async updateProfile(@GetUser() user: User, @Body() dto: ProfileUpdateDto) {
    if (dto.nickname === undefined && dto.website === undefined && dto.passions === undefined) {
      throw new AppException(ERROR_CODE.NO_FIELD_PROVIDED);
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        infos: {
          update: {
            nickname: dto.nickname,
            passions: dto.passions,
            website: dto.website,
          },
        },
      },
    });
  }
}

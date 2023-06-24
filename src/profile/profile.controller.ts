import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../prisma/types';
import { ProfileUpdateDto } from './dto/profile-update.dto';

@Controller('profile')
export class ProfileController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtGuard)
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
    };
  }

  @Post()
  @UseGuards(JwtGuard)
  async updateProfile(@GetUser() user: User, @Body() dto: ProfileUpdateDto) {
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

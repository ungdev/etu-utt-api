import { Body, Controller, Get, HttpCode, Patch, Post, Put } from "@nestjs/common";
import { GetUser } from '../auth/decorator';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../users/interfaces/user.interface';
import { ProfileUpdateDto } from './dto/profile-update.dto';
import { AppException, ERROR_CODE } from '../exceptions';
import { FileSize, MulterWithMime, UploadRoute, UserFile } from '../upload.interceptor';
import sharp from "sharp";
import { writeFile } from "fs/promises";
import { ConfigModule } from "../config/config.module";

@Controller('profile')
export class ProfileController {
  constructor(private prisma: PrismaService, private config: ConfigModule) {}

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

  @Patch('/avatar')
  @UploadRoute('file')
  async updateAvatar(
    @GetUser() user: User,
    @UserFile(['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/tiff'], 8 * FileSize.MegaByte)
    filePromise: Promise<MulterWithMime>,
  ) {
    const file = await filePromise;
    if (file.mime === 'image/webp' || file.mime === 'image/avif' || file.mime === 'image/tiff') {
      file.multer.buffer = await sharp(file.multer.buffer).webp().toBuffer();
      file.mime = 'image/webp';
    }
    await writeFile(`${this.config.AVATAR_UPLOAD_DIR}/${user.id}.webp`, file.multer.buffer);
    await this.prisma.userInfos.update({
      where: { id: user.infos.id },
      data: { avatar: `${this.config.AVATAR_UPLOAD_DIR}/${user.id}.webp` },
    });
    return { avatar: `${this.config.AVATAR_UPLOAD_DIR}/${user.id}.webp` };
  }
}

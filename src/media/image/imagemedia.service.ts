import { createReadStream, ReadStream } from 'fs';
import { rm, writeFile } from 'fs/promises';
import { Injectable } from '@nestjs/common';
import { ImageMedia, ImageMediaPreset } from '@prisma/client';
import { ConfigModule } from '../../config/config.module';
import { PrismaService } from '../../prisma/prisma.service';
import { MulterWithMime } from '../../upload.interceptor';
import { User } from '../../users/interfaces/user.interface';
import ImageMediaUploadReqDto from './dto/req/imagemedia-upload-req.dto';
import sharp from 'sharp';

export type ConversionOptions = Omit<ImageMediaUploadReqDto, 'public'>;

type PresetStruct = Record<
  Exclude<ImageMediaPreset, typeof ImageMediaPreset.CUSTOM>,
  Omit<ConversionOptions, 'preset'>
>;
const presets: PresetStruct = {
  AVATAR: { width: 256, height: 256, quality: 70, effort: 5 },
};

export type ImageMetadata = Omit<ImageMedia, 'id' | 'uploadedAt' | 'isPublic' | 'uploaderId'>;

@Injectable()
export class ImageMediaService {
  constructor(
    readonly prisma: PrismaService,
    readonly config: ConfigModule,
  ) {}

  async convertMedia(file: MulterWithMime, options: ConversionOptions): Promise<ImageMetadata> {
    if (!(options.preset in presets)) options.preset = ImageMediaPreset.CUSTOM;
    if (options.preset) Object.assign(options, presets[options.preset]);
    let instructions = sharp(file.multer.buffer);
    let metadata = await instructions.metadata();
    const size = [metadata.width, metadata.height];
    if (options.rotation) {
      instructions = instructions.rotate(options.rotation * 90);
      size.reverse();
    }
    if (size[0] > 1920 && !options.width) options.width = 1920;
    if (size[1] > 1080 && !options.height) options.height = 1080;
    if (options.width && options.height)
      instructions = instructions.resize(options.width, options.height, { fit: 'cover' });
    file.mime = 'image/webp';
    instructions = instructions.webp({
      quality: options.quality,
      effort: options.effort,
      nearLossless: true,
      smartSubsample: true,
      alphaQuality: options.quality,
    });
    file.multer.buffer = await instructions.toBuffer();
    metadata = await sharp(file.multer.buffer).metadata();
    return { width: metadata.width, height: metadata.height, size: file.multer.buffer.length, preset: options.preset };
  }

  async registerMedia(metadata: ImageMetadata, uploader: User, isPublic: boolean): Promise<ImageMedia> {
    const image = await this.prisma.imageMedia.create({
      data: {
        ...metadata,
        uploader: {
          connect: { id: uploader.id },
        },
        isPublic,
      },
    });
    return image;
  }

  async rollbackMedia(media: ImageMedia): Promise<void> {
    await this.prisma.imageMedia.create({ data: media });
  }

  async unRegisterMedia(mediaId: string): Promise<ImageMedia> {
    return this.prisma.imageMedia.delete({ where: { id: mediaId } });
  }

  async getMedia(mediaId: string): Promise<ImageMedia> {
    return this.prisma.imageMedia.findUnique({ where: { id: mediaId } });
  }

  async writeMediaToDisk(mediaId: string, buffer: Buffer): Promise<void> {
    await writeFile(`${this.config.MEDIA_UPLOAD_DIR}/image/${mediaId}.webp`, buffer);
  }

  readMediaFromDisk(mediaId: string): ReadStream {
    return createReadStream(`${this.config.MEDIA_UPLOAD_DIR}/image/${mediaId}.webp`);
  }

  async cleanup() {
    const media = await this.clearUnusedMedia();
    const deletions = media.map((m) => this.deleteMediaFromDisk(m.id).catch(() => m)); // return media on failure
    const failedDeletions = (await Promise.all(deletions)).filter((r): r is ImageMedia => r !== undefined);
    failedDeletions.map(this.rollbackMedia); // Restore failed media, no need to wait for completion
  }

  /**
   * Clears unused from the Database. {@link ImageMediaService.deleteMediaFromDisk DeleteMediaFromDisk} must be called
   * with the output of this method to clear data from disk.
   */
  private async clearUnusedMedia(): Promise<ImageMedia[]> {
    const targetMedias = await this.prisma.imageMedia.findMany({
      where: {
        // Filter explanation https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries#filter-on-absence-of--to-many-records
        avatarForUsers: { none: {} },
        logoForAssos: { none: {} },
        descriptionForAssos: { none: {} },
        uploadedAt: { lt: new Date(Date.now() - this.config.MEDIA_DETACHED_LIFESPAN * 86_400_000) },
      },
    });
    await this.prisma.imageMedia.deleteMany({
      where: { id: { in: targetMedias.map((media) => media.id) } },
    });
    return targetMedias;
  }

  async writeMediaToDisk(mediaId: string, buffer: Buffer): Promise<void> {
    await writeFile(`${this.config.MEDIA_UPLOAD_DIR}/image/${mediaId}.webp`, buffer);
  }

  readMediaFromDisk(mediaId: string): ReadStream {
    return createReadStream(`${this.config.MEDIA_UPLOAD_DIR}/image/${mediaId}.webp`);
  }

  private async deleteMediaFromDisk(mediaId: string): Promise<void> {
    await rm(`${this.config.MEDIA_UPLOAD_DIR}/image/${mediaId}.webp`, { force: true });
  }

  async cleanup() {
    const media = await this.clearUnusedMedia();
    (await Promise.all(media.map((m) => this.deleteMediaFromDisk(m.id).catch(() => m)))).map(
      (r) => r && this.rollbackMedia(r),
    );
  }
}

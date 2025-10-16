import { Controller, Get, Post, Query, Response } from '@nestjs/common';
import { ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';
import { FileSize, MulterWithMime, UploadRoute, UserFile } from '../../upload.interceptor';
import { GetUser, IsPublic, RequireApiPermission } from '../../auth/decorator';
import { AppException, ERROR_CODE } from '../../exceptions';
import { ApiAppErrorResponse } from '../../app.dto';
import { ImageMediaService } from './imagemedia.service';
import { UUIDParam } from '../../app.pipe';
import { omit } from '../../utils';
import { User } from '../../users/interfaces/user.interface';
import ImageMediaUploadReqDto from './dto/req/imagemedia-upload-req.dto';
import ImageMediaUploadResDto from './dto/res/imagemedia-upload-res.dto';

@Controller('media/image')
@ApiTags('Media')
export class ImageMediaController {
  constructor(readonly imageMediaService: ImageMediaService) {}

  @Get('/:mediaId')
  @IsPublic()
  @ApiOperation({ description: 'Retrieve a media by its id.' })
  @ApiOkResponse({ description: 'The media is contained in the body of the response' })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_MEDIA, 'There is no media with the given id')
  @ApiAppErrorResponse(ERROR_CODE.NOT_LOGGED_IN, 'This media is not public and requires authentication')
  @ApiAppErrorResponse(ERROR_CODE.SERVER_DISK_ERROR, 'An error occurred while reading from disk')
  async getMedia(@UUIDParam('mediaId') mediaId: string, @GetUser() user: User, @Response() response: ExpressResponse) {
    const media = await this.imageMediaService.getMedia(mediaId);
    if (!media) throw new AppException(ERROR_CODE.NO_SUCH_MEDIA, mediaId);
    if (!media.isPublic && !user) throw new AppException(ERROR_CODE.NOT_LOGGED_IN);
    try {
      const stream = this.imageMediaService.readMediaFromDisk(mediaId);
      response.setHeader('Content-Type', 'image/webp');
      stream.pipe(response);
    } catch {
      throw new AppException(ERROR_CODE.SERVER_DISK_ERROR);
    }
  }

  @Post('/')
  @RequireApiPermission('API_UPLOAD_MEDIA')
  @UploadRoute('file')
  @ApiConsumes('image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/tiff')
  @ApiOperation({ description: 'Uploads a media and returns its id.' })
  @ApiCreatedResponse({ type: ImageMediaUploadResDto })
  @ApiAppErrorResponse(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'The permission is missing on the API key')
  @ApiAppErrorResponse(ERROR_CODE.SERVER_DISK_ERROR, 'An error occurred while writing to disk')
  async uploadMedia(
    @UserFile(['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/tiff'], 8 * FileSize.MegaByte)
    file: Promise<MulterWithMime>,
    @GetUser() user: User,
    @Query() options: ImageMediaUploadReqDto,
  ): Promise<ImageMediaUploadResDto> {
    const multer = await file;
    const media = await this.imageMediaService.convertMedia(multer, options);
    const savedMedia = await this.imageMediaService.registerMedia(media, user, options.public ?? false);
    try {
      this.imageMediaService.writeMediaToDisk(savedMedia.id, multer.multer.buffer);
    } catch {
      this.imageMediaService.unRegisterMedia(savedMedia.id);
      throw new AppException(ERROR_CODE.SERVER_DISK_ERROR);
    }
    this.imageMediaService.cleanup();
    return omit(savedMedia, 'uploaderId', 'uploadedAt');
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Response,
  StreamableFile,
} from '@nestjs/common';
import { AnnalsService } from './annals.service';
import { UEService } from '../ue.service';
import { Response as ExpressResponse } from 'express';
import { UUIDParam } from '../../app.pipe';
import { RequireUserType, GetUser } from '../../auth/decorator';
import { AppException, ERROR_CODE } from '../../exceptions';
import { UploadRoute, UserFile, FileSize, MulterWithMime } from '../../upload.interceptor';
import { CommentStatus } from '../comments/interfaces/comment.interface';
import { CreateAnnal } from './dto/create-annal.dto';
import { UpdateAnnalDto } from './dto/update-annal.dto';
import { User } from '../../users/interfaces/user.interface';
import { GetFromUeCodeDto } from './dto/get-from-ue.dto';
import { UploadAnnalDto } from './dto/upload-annal.dto';

@Controller('ue/annals')
export class AnnalsController {
  constructor(readonly annalsService: AnnalsService, readonly ueService: UEService) {}

  @Get()
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async getUeAnnalList(@Query() { ueCode }: GetFromUeCodeDto, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.annalsService.getUEAnnalsList(user, ueCode, user.permissions.includes('annalModerator'));
  }

  @Post()
  @RequireUserType('STUDENT')
  @UploadRoute('file')
  async createUeAnnal(@Body() { ueCode, semester, typeId }: CreateAnnal, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.annalsService.doesAnnalTypeExist(typeId))) throw new AppException(ERROR_CODE.NO_SUCH_ANNAL_TYPE);
    if (
      !(await this.ueService.hasDoneThisUEInSemester(user.id, ueCode, semester)) &&
      !user.permissions.includes('annalUploader')
    )
      throw new AppException(ERROR_CODE.NOT_DONE_UE_IN_SEMESTER, ueCode, semester);
    return this.annalsService.createAnnalFile(user, { ueCode, semester, typeId });
  }

  @Get('metadata')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async getUeAnnalMetadata(@Query() { ueCode }: GetFromUeCodeDto, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.hasAlreadyDoneThisUE(user.id, ueCode)) && !user.permissions.includes('annalUploader'))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    return this.annalsService.getUEAnnalMetadata(user, ueCode, user.permissions.includes('annalUploader'));
  }

  @Put(':annalId')
  @RequireUserType('STUDENT')
  @UploadRoute('file')
  async uploadUeAnnal(
    @UserFile(
      ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/tiff'],
      8 * FileSize.MegaByte,
    )
    file: Promise<MulterWithMime>,
    @Param('annalId') annalId: string,
    @Query() { rotate }: UploadAnnalDto,
    @GetUser() user: User,
  ) {
    if (!(await this.annalsService.isUEAnnalSender(user.id, annalId)))
      throw new AppException(ERROR_CODE.NOT_ANNAL_SENDER);
    if (
      (await this.annalsService.getUEAnnal(annalId, user.id, user.permissions.includes('annalModerator'))).status !==
      CommentStatus.PROCESSING
    )
      throw new AppException(ERROR_CODE.ANNAL_ALREADY_UPLOADED);
    return this.annalsService.uploadAnnalFile(await file, annalId, rotate);
  }

  @Get(':annalId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async getUeAnnal(
    @UUIDParam('annalId') annalId: string,
    @GetUser() user: User,
    @Response() response: ExpressResponse,
  ) {
    if (!(await this.annalsService.isAnnalAccessible(user.id, annalId, user.permissions.includes('annalModerator'))))
      throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId);
    const annalFile = await this.annalsService.getUEAnnalFile(
      annalId,
      user.id,
      user.permissions.includes('annalModerator'),
    );
    if (!annalFile) throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename=${annalFile.metadata.type.name} ${annalFile.metadata.ue.code} - ${annalFile.metadata.semesterId}`,
    );
    return new StreamableFile(annalFile.stream);
  }

  @Patch(':annalId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async updateUeAnnal(@UUIDParam('annalId') annalId: string, @Body() body: UpdateAnnalDto, @GetUser() user: User) {
    if (!(await this.annalsService.isAnnalAccessible(user.id, annalId, user.permissions.includes('annalModerator'))))
      throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId);
    if (!(await this.annalsService.isUEAnnalSender(user.id, annalId)) && !user.permissions.includes('annalModerator'))
      throw new AppException(ERROR_CODE.NOT_ANNAL_SENDER);
    return this.annalsService.updateAnnalMetadata(annalId, body);
  }

  @Delete(':annalId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async deleteUeAnnal(@UUIDParam('annalId') annalId: string, @GetUser() user: User) {
    if (!(await this.annalsService.isAnnalAccessible(user.id, annalId, user.permissions.includes('annalModerator'))))
      throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId);
    if (!(await this.annalsService.isUEAnnalSender(user.id, annalId)) && !user.permissions.includes('annalModerator'))
      throw new AppException(ERROR_CODE.NOT_ANNAL_SENDER);
    return this.annalsService.deleteAnnal(annalId);
  }
}

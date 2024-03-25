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
import { RequireRole, GetUser } from '../../auth/decorator';
import { AppException, ERROR_CODE } from '../../exceptions';
import { UploadRoute, UserFile, FileSize, MulterWithMime } from '../../upload.interceptor';
import { CommentStatus } from '../interfaces/comment.interface';
import { CreateAnnal } from './dto/create-annal.dto';
import { UpdateAnnal } from './dto/update-annal.dto';
import { User } from '../../users/interfaces/user.interface';

@Controller('ue/:ueCode/annals')
export class AnnalsController {
  constructor(readonly annalsService: AnnalsService, readonly ueService: UEService) {}

  @Get('metadata')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async getUeAnnalMetadata(@Param('ueCode') ueCode: string, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.hasAlreadyDoneThisUE(user.id, ueCode)) && !user.permissions.includes('annalUploader'))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    return this.annalsService.getUEAnnalMetadata(user, ueCode, user.permissions.includes('annalUploader'));
  }

  @Post('')
  @RequireRole('STUDENT')
  @UploadRoute('file')
  async createUeAnnal(@Param('ueCode') ueCode: string, @Body() body: CreateAnnal, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (
      !(await this.ueService.hasDoneThisUEInSemester(user.id, ueCode, body.semester)) &&
      !user.permissions.includes('annalUploader')
    )
      throw new AppException(ERROR_CODE.NOT_DONE_UE_IN_SEMESTER, ueCode, body.semester);
    return this.annalsService.createAnnalFile(user, ueCode, body);
  }

  @Put(':annalId')
  @RequireRole('STUDENT')
  @UploadRoute('file')
  async uploadUeAnnal(
    @UserFile(
      ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/tiff'],
      8 * FileSize.MegaByte,
    )
    file: Promise<MulterWithMime>,
    @Param('ueCode') ueCode: string,
    @Param('annalId') annalId: string,
    @Query('rotate') rotate: number,
    @GetUser() user: User,
  ) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.annalsService.isUEAnnalSender(user.id, annalId)))
      throw new AppException(ERROR_CODE.NOT_ANNAL_SENDER);
    if (
      (await this.annalsService.getUEAnnal(annalId, user.id, user.permissions.includes('annalModerator'))).status !==
      CommentStatus.PROCESSING
    )
      throw new AppException(ERROR_CODE.ANNAL_ALREADY_UPLOADED);
    const rotation = Number(rotate);
    return this.annalsService.uploadAnnalFile(
      await file,
      annalId,
      isNaN(rotation) || rotation < -1 || rotation > 1 ? 0 : (rotation as -1 | 0 | 1),
    );
  }

  @Get('')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async getUeAnnalList(@Param('ueCode') ueCode: string, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.annalsService.getUEAnnalsList(user, ueCode, user.permissions.includes('annalModerator'));
  }

  @Get(':annalId')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async getUeAnnal(
    @Param('ueCode') ueCode: string,
    @UUIDParam('annalId') annalId: string,
    @GetUser() user: User,
    @Response() response: ExpressResponse,
  ) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (
      !(await this.annalsService.doesUEAnnalExist(
        user.id,
        ueCode,
        annalId,
        user.permissions.includes('annalModerator'),
      ))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId, ueCode);
    const annalFile = await this.annalsService.getUEAnnalFile(
      annalId,
      user.id,
      user.permissions.includes('annalModerator'),
    );
    if (!annalFile) throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId, ueCode);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename=${annalFile.metadata.type.name} ${ueCode} - ${annalFile.metadata.semesterId}`,
    );
    return new StreamableFile(annalFile.stream);
  }

  @Patch(':annalId')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async updateUeAnnal(
    @Param('ueCode') ueCode: string,
    @UUIDParam('annalId') annalId: string,
    @Body() body: UpdateAnnal,
    @GetUser() user: User,
  ) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (
      !(await this.annalsService.doesUEAnnalExist(
        user.id,
        ueCode,
        annalId,
        user.permissions.includes('annalModerator'),
      ))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId, ueCode);
    if (!(await this.annalsService.isUEAnnalSender(user.id, annalId)) && !user.permissions.includes('annalModerator'))
      throw new AppException(ERROR_CODE.NOT_ANNAL_SENDER);
    return this.annalsService.updateAnnalMetadata(annalId, body);
  }

  @Delete(':annalId')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async deleteUeAnnal(@Param('ueCode') ueCode: string, @UUIDParam('annalId') annalId: string, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (
      !(await this.annalsService.doesUEAnnalExist(
        user.id,
        ueCode,
        annalId,
        user.permissions.includes('annalModerator'),
      ))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId, ueCode);
    if (!(await this.annalsService.isUEAnnalSender(user.id, annalId)) && !user.permissions.includes('annalModerator'))
      throw new AppException(ERROR_CODE.NOT_ANNAL_SENDER);
    return this.annalsService.deleteAnnal(annalId);
  }
}

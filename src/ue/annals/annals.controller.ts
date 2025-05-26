import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Response } from '@nestjs/common';
import { AnnalsService } from './annals.service';
import { UeService } from '../ue.service';
import { Response as ExpressResponse } from 'express';
import { UUIDParam } from '../../app.pipe';
import { GetUser, RequireApiPermission } from '../../auth/decorator';
import { AppException, ERROR_CODE } from '../../exceptions';
import { FileSize, MulterWithMime, UploadRoute, UserFile } from '../../upload.interceptor';
import { CommentStatus } from '../comments/interfaces/comment.interface';
import { CreateAnnalReqDto } from './dto/req/create-annal-req.dto';
import { UpdateAnnalReqDto } from './dto/req/update-annal-req.dto';
import { User } from '../../users/interfaces/user.interface';
import { GetFromUeReqDto } from './dto/req/get-from-ue-req.dto';
import UploadAnnalReqDto from './dto/req/upload-annal-req.dto';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAppErrorResponse } from '../../app.dto';
import UeAnnalResDto from './dto/res/ue-annal-res.dto';
import UeAnnalMetadataResDto from './dto/res/ue-annal-metadata-res.dto';
import { GetPermissions } from '../../auth/decorator/get-permissions.decorator';
import { Permission } from '@prisma/client';
import { PermissionManager } from '../../utils';

@Controller('ue/annals')
@ApiTags('Annal')
export class AnnalsController {
  constructor(
    readonly annalsService: AnnalsService,
    readonly ueService: UeService,
  ) {}

  @Get()
  @RequireApiPermission('API_SEE_ANNALS')
  @ApiOperation({ description: 'Get the list of annals of a UE.' })
  @ApiOkResponse({ type: UeAnnalResDto, isArray: true })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_UE, 'Thrown when there is no UE with code `ueCode`.')
  async getUeAnnalList(
    @Query() { ueCode }: GetFromUeReqDto,
    @GetUser() user: User,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<UeAnnalResDto[]> {
    if (!(await this.ueService.doesUeExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.annalsService.getUeAnnalsList(user, ueCode, permissions.can(Permission.API_MODERATE_ANNALS));
  }

  @Post()
  @RequireApiPermission('API_UPLOAD_ANNALS')
  @ApiOperation({
    description:
      'Create an annal. User must have done the UE, or have the permission `API_MODERATE_ANNALS`. Metadata of the annal will be created, but the file will not actually exist. To upload the file, see `PUT /v1/ue/annals/:annalId`.',
  })
  @ApiOkResponse({ type: UeAnnalResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_UE, 'Thrown when there is no UE with code `ueCode`.')
  @ApiAppErrorResponse(
    ERROR_CODE.NO_SUCH_ANNAL_TYPE,
    'Thrown when the type of the new annal is not an actual annal type.',
  )
  @ApiAppErrorResponse(
    ERROR_CODE.NOT_DONE_UE_IN_SEMESTER,
    'User has not done the UE and is not an `API_MODERATE_ANNALS`, and thus cannot upload an annal for this UE.',
  )
  async createUeAnnal(
    @Body() { ueCode, semester, typeId, ueof }: CreateAnnalReqDto,
    @GetUser() user: User,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<UeAnnalResDto> {
    if (ueof && !permissions.can(Permission.API_MODERATE_ANNALS))
      throw new AppException(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, Permission.API_MODERATE_ANNALS);
    if (!ueof && !(await this.ueService.doesUeExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (ueof && !(await this.ueService.doesUeofExist(ueof))) throw new AppException(ERROR_CODE.NO_SUCH_UEOF, ueof);
    if (!(await this.annalsService.doesAnnalTypeExist(typeId))) throw new AppException(ERROR_CODE.NO_SUCH_ANNAL_TYPE);
    if (
      !(await this.ueService.hasUserAttended(ueCode, user.id, semester)) &&
      !permissions.can(Permission.API_MODERATE_ANNALS)
    )
      throw new AppException(ERROR_CODE.NOT_DONE_UE_IN_SEMESTER, ueCode, semester);
    if (!(await this.ueService.didUeHappenAtSemester(ueCode, semester)))
      throw new AppException(ERROR_CODE.NO_SUCH_UE_AT_SEMESTER, ueCode, semester);
    return this.annalsService.createAnnalFile(user, { ueCode, semester, typeId, ueof });
  }

  @Get('metadata')
  @RequireApiPermission('API_SEE_ANNALS')
  @ApiOperation({
    description:
      'Get generic information about annals for a particular UE. User must have already done this UE, or be an `annalUploader`.',
  })
  @ApiBody({
    description:
      '* `semesters`: Semesters for which the user can upload an annal\n* types: Existing annal types (median, final, ...)',
  })
  @ApiOkResponse({ type: UeAnnalMetadataResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_UE, 'There is no UE with the provided `ueCode`.')
  @ApiAppErrorResponse(ERROR_CODE.NOT_ALREADY_DONE_UE)
  async getUeAnnalMetadata(
    @Query() { ueCode }: GetFromUeReqDto,
    @GetUser() user: User,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<UeAnnalMetadataResDto> {
    if (!(await this.ueService.doesUeExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.hasUserAttended(ueCode, user.id)) && !permissions.can(Permission.API_UPLOAD_ANNALS))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    return this.annalsService.getUeAnnalMetadata(user, ueCode, permissions.can(Permission.API_UPLOAD_ANNALS));
  }

  @Put(':annalId')
  @RequireApiPermission('API_UPLOAD_ANNALS')
  @UploadRoute('file')
  @ApiOperation({
    description:
      'Upload an annal file linked to a specific metadata. Metadata must be created first, see `POST /v1/ue/annals`. User must be the same user as the one who created the metadata.',
  })
  @ApiConsumes('application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/tiff')
  @ApiOkResponse({ type: UeAnnalMetadataResDto })
  @ApiAppErrorResponse(ERROR_CODE.NOT_ANNAL_SENDER)
  @ApiAppErrorResponse(
    ERROR_CODE.ANNAL_ALREADY_UPLOADED,
    'Produced when user uploads an annal while the another annal linked to the same metadata is being uploaded.',
  )
  async uploadUeAnnal(
    @UserFile(
      ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/tiff'],
      8 * FileSize.MegaByte,
    )
    file: Promise<MulterWithMime>,
    @Param('annalId') annalId: string,
    @Query() { rotate }: UploadAnnalReqDto,
    @GetUser() user: User,
    @GetPermissions() permissions: PermissionManager,
  ) {
    if (!(await this.annalsService.isUeAnnalSender(user.id, annalId)))
      throw new AppException(ERROR_CODE.NOT_ANNAL_SENDER);
    if (
      (await this.annalsService.getUeAnnal(annalId, user.id, permissions.can(Permission.API_MODERATE_ANNALS)))
        .status !== CommentStatus.PROCESSING
    )
      throw new AppException(ERROR_CODE.ANNAL_ALREADY_UPLOADED);
    return this.annalsService.uploadAnnalFile(await file, annalId, rotate);
  }

  @Get(':annalId')
  @RequireApiPermission('API_SEE_ANNALS')
  @ApiOperation({ description: 'Get the file linked to a specific annal.' })
  @ApiOkResponse({ description: 'The file is sent back.' })
  @ApiAppErrorResponse(
    ERROR_CODE.NO_SUCH_ANNAL,
    'May be thrown if annal is not accessible (not validated and user is not an `annalModerator`), or if the metadata for the annal exists but the file has not yet been uploaded.',
  )
  async getUeAnnal(
    @UUIDParam('annalId') annalId: string,
    @GetUser() user: User,
    @Response() response: ExpressResponse,
    @GetPermissions() permissions: PermissionManager,
  ) {
    if (
      !(await this.annalsService.isAnnalAccessible(user.id, annalId, permissions.can(Permission.API_MODERATE_ANNALS)))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId);
    const annalFile = await this.annalsService.getUeAnnalFile(
      annalId,
      user.id,
      permissions.can(Permission.API_MODERATE_ANNALS),
    );
    if (!annalFile) throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename=${annalFile.metadata.type.name} ${annalFile.metadata.ueof.code} - ${annalFile.metadata.semesterId}`,
    );
    annalFile.stream.pipe(response);
  }

  @Patch(':annalId')
  @RequireApiPermission('API_UPLOAD_ANNALS')
  @ApiOperation({
    description:
      'Modify the metadata of an annal. User must be the original sender of the annal, or be an `annalModerator`.',
  })
  @ApiOkResponse({ type: UeAnnalResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ANNAL)
  @ApiAppErrorResponse(ERROR_CODE.NOT_ANNAL_SENDER)
  async updateUeAnnal(
    @UUIDParam('annalId') annalId: string,
    @Body() body: UpdateAnnalReqDto,
    @GetUser() user: User,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<UeAnnalResDto> {
    if (
      !(await this.annalsService.isAnnalAccessible(user.id, annalId, permissions.can(Permission.API_MODERATE_ANNALS)))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId);
    if (
      !(await this.annalsService.isUeAnnalSender(user.id, annalId)) &&
      !permissions.can(Permission.API_MODERATE_ANNALS)
    )
      throw new AppException(ERROR_CODE.NOT_ANNAL_SENDER);
    return this.annalsService.updateAnnalMetadata(annalId, body);
  }

  @Delete(':annalId')
  @RequireApiPermission('API_UPLOAD_ANNALS')
  @ApiOperation({
    description:
      'Delete an annal. The file attached to the annal will not actually be deleted. User must be the original sender of the annal, or be an `annalModerator`.',
  })
  @ApiOkResponse({ type: UeAnnalResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_ANNAL)
  @ApiAppErrorResponse(ERROR_CODE.NOT_ANNAL_SENDER)
  async deleteUeAnnal(
    @UUIDParam('annalId') annalId: string,
    @GetUser() user: User,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<UeAnnalResDto> {
    if (
      !(await this.annalsService.isAnnalAccessible(user.id, annalId, permissions.can(Permission.API_MODERATE_ANNALS)))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId);
    if (
      !(await this.annalsService.isUeAnnalSender(user.id, annalId)) &&
      !permissions.can(Permission.API_MODERATE_ANNALS)
    )
      throw new AppException(ERROR_CODE.NOT_ANNAL_SENDER);
    return this.annalsService.deleteAnnal(annalId);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Response,
  StreamableFile,
} from '@nestjs/common';
import { UESearchDto } from './dto/ue-search.dto';
import { UEService } from './ue.service';
import { GetUser, IsPublic, RequireRole } from '../auth/decorator';
import { User } from '../users/interfaces/user.interface';
import { UeCommentPostDto } from './dto/ue-comment-post.dto';
import { AppException, ERROR_CODE } from '../exceptions';
import { UERateDto } from './dto/ue-rate.dto';
import { UeCommentUpdateDto } from './dto/ue-comment-update.dto';
import { CommentReplyDto } from './dto/ue-comment-reply.dto';
import { GetUECommentsDto } from './dto/ue-get-comments.dto';
import { FileSize, MulterWithMime, UploadRoute, UserFile } from '../upload.interceptor';
import { Response as ExpressResponse } from 'express';
import { UUIDParam } from '../app.pipe';
import { UpdateAnnal } from './dto/update-annal.dto';
import { CreateAnnal } from './dto/create-annal.dto';
import { CommentStatus } from './interfaces/comment.interface';

@Controller('ue')
export class UEController {
  constructor(readonly ueService: UEService) {}

  @Get()
  @IsPublic()
  async searchUE(@Query() queryParams: UESearchDto) {
    return this.ueService.searchUEs(queryParams);
  }

  @Get('/:ueCode')
  @IsPublic()
  async getUE(@Param('ueCode') ueCode: string) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.ueService.getUE(ueCode.toUpperCase());
  }

  @Get('/:ueCode/comments')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async getUEComments(@Param('ueCode') ueCode: string, @GetUser() user: User, @Query() dto: GetUECommentsDto) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.ueService.getComments(
      ueCode,
      user.id,
      dto,
      user.permissions.includes('commentModerator'),
      user.permissions.includes('commentModerator'),
    );
  }

  @Post('/:ueCode/comments')
  @RequireRole('STUDENT')
  async PostUEComment(@Param('ueCode') ueCode: string, @GetUser() user: User, @Body() body: UeCommentPostDto) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.hasAlreadyDoneThisUE(user.id, ueCode)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    if (await this.ueService.hasAlreadyPostedAComment(user.id, ueCode))
      throw new AppException(ERROR_CODE.FORBIDDEN_ALREADY_COMMENTED);
    return this.ueService.createComment(body, user.id, ueCode);
  }

  @Patch('/comments/:commentId')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async EditUEComment(
    @UUIDParam('commentId') commentId: string,
    @GetUser() user: User,
    @Body() body: UeCommentUpdateDto,
  ) {
    if (
      !(await this.ueService.doesCommentExist(
        commentId,
        user.id,
        user.permissions.includes('commentModerator'),
        user.permissions.includes('commentModerator'),
      ))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (await this.ueService.isUserCommentAuthor(user.id, commentId))
      return this.ueService.updateComment(body, commentId, user.id, user.permissions.includes('commentModerator'));
    throw new AppException(ERROR_CODE.NOT_COMMENT_AUTHOR);
  }

  @Delete('/comments/:commentId')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async DiscardUEComment(@UUIDParam('commentId') commentId: string, @GetUser() user: User) {
    if (!(await this.ueService.doesCommentExist(commentId, user.id, user.permissions.includes('commentModerator'))))
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (await this.ueService.isUserCommentAuthor(user.id, commentId))
      return this.ueService.deleteComment(commentId, user.id);
    throw new AppException(ERROR_CODE.NOT_COMMENT_AUTHOR);
  }

  @Post('/comments/:commentId/upvote')
  @RequireRole('STUDENT')
  @HttpCode(HttpStatus.CREATED)
  async UpvoteUEComment(@UUIDParam('commentId') commentId: string, @GetUser() user: User) {
    if (
      !(await this.ueService.doesCommentExist(
        commentId,
        user.id,
        user.permissions.includes('commentModerator'),
        user.permissions.includes('commentModerator'),
      ))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (await this.ueService.isUserCommentAuthor(user.id, commentId))
      throw new AppException(ERROR_CODE.IS_COMMENT_AUTHOR);
    if (await this.ueService.hasAlreadyUpvoted(user.id, commentId))
      throw new AppException(ERROR_CODE.FORBIDDEN_ALREADY_UPVOTED);
    await this.ueService.upvoteComment(user.id, commentId);
  }

  @Delete('/comments/:commentId/upvote')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  @HttpCode(HttpStatus.NO_CONTENT)
  async UnUpvoteUEComment(@UUIDParam('commentId') commentId: string, @GetUser() user: User) {
    if (
      !(await this.ueService.doesCommentExist(
        commentId,
        user.id,
        user.permissions.includes('commentModerator'),
        user.permissions.includes('commentModerator'),
      ))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (await this.ueService.isUserCommentAuthor(user.id, commentId))
      throw new AppException(ERROR_CODE.IS_COMMENT_AUTHOR);
    if (!(await this.ueService.hasAlreadyUpvoted(user.id, commentId)))
      throw new AppException(ERROR_CODE.FORBIDDEN_ALREADY_UNUPVOTED);
    await this.ueService.deUpvoteComment(user.id, commentId);
  }

  @Post('/comments/:commentId/reply')
  @RequireRole('STUDENT')
  async CreateReplyComment(
    @GetUser() user: User,
    @UUIDParam('commentId') commentId: string,
    @Body() body: CommentReplyDto,
  ) {
    if (
      !(await this.ueService.doesCommentExist(
        commentId,
        user.id,
        user.permissions.includes('commentModerator'),
        user.permissions.includes('commentModerator'),
      ))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    return this.ueService.replyComment(user.id, commentId, body);
  }

  @Patch('/comments/reply/:replyId')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async EditReplyComment(@GetUser() user: User, @UUIDParam('replyId') replyId: string, @Body() body: CommentReplyDto) {
    if (!(await this.ueService.doesReplyExist(replyId, user.id, user.permissions.includes('commentModerator'))))
      throw new AppException(ERROR_CODE.NO_SUCH_REPLY);
    if (
      (await this.ueService.isUserCommentReplyAuthor(user.id, replyId)) ||
      user.permissions.includes('commentModerator')
    )
      return this.ueService.editReply(replyId, body);
    throw new AppException(ERROR_CODE.NOT_REPLY_AUTHOR);
  }

  @Delete('/comments/reply/:replyId')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async DeleteReplyComment(@GetUser() user: User, @UUIDParam('replyId') replyId: string) {
    if (!(await this.ueService.doesReplyExist(replyId, user.id, user.permissions.includes('commentModerator'))))
      throw new AppException(ERROR_CODE.NO_SUCH_REPLY);
    if (
      (await this.ueService.isUserCommentReplyAuthor(user.id, replyId)) ||
      user.permissions.includes('commentModerator')
    )
      return this.ueService.deleteReply(replyId);
    throw new AppException(ERROR_CODE.NOT_REPLY_AUTHOR);
  }

  @Get('/rate/criteria')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async GetRateCriteria() {
    return this.ueService.getRateCriteria();
  }

  @Get('/:ueCode/rate')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async GetRateUE(@Param('ueCode') ueCode: string, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.ueService.getRateUE(user.id, ueCode);
  }

  @Put('/:ueCode/rate')
  @RequireRole('STUDENT')
  async RateUE(@Param('ueCode') ueCode: string, @GetUser() user: User, @Body() dto: UERateDto) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.doesCriterionExist(dto.criterion))) throw new AppException(ERROR_CODE.NO_SUCH_CRITERION);
    if (!(await this.ueService.hasAlreadyDoneThisUE(user.id, ueCode)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    return this.ueService.doRateUE(user.id, ueCode, dto);
  }

  @Delete('/:ueCode/rate/:criterionId')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async UnRateUE(
    @Param('ueCode') ueCode: string,
    @UUIDParam('criterionId') criterionId: string,
    @GetUser() user: User,
  ) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.doesCriterionExist(criterionId))) throw new AppException(ERROR_CODE.NO_SUCH_CRITERION);
    if (!(await this.ueService.hasAlreadyRated(user.id, ueCode, criterionId)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_RATED_UE, ueCode, criterionId);
    return this.ueService.unRateUE(user.id, ueCode, criterionId);
  }

  @Get('/:ueCode/annals/metadata')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async getUeAnnalMetadata(@Param('ueCode') ueCode: string, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.hasAlreadyDoneThisUE(user.id, ueCode)) && !user.permissions.includes('annalUploader'))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    return this.ueService.getUEAnnalMetadata(user, ueCode, user.permissions.includes('annalUploader'));
  }

  @Post('/:ueCode/annals')
  @RequireRole('STUDENT')
  @UploadRoute('file')
  async createUeAnnal(@Param('ueCode') ueCode: string, @Body() body: CreateAnnal, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (
      !(await this.ueService.hasDoneThisUEInSemester(user.id, ueCode, body.semester)) &&
      !user.permissions.includes('annalUploader')
    )
      throw new AppException(ERROR_CODE.NOT_DONE_UE_IN_SEMESTER, ueCode, body.semester);
    return this.ueService.createAnnalFile(user, ueCode, body);
  }

  @Put('/:ueCode/annals/:annalId')
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
    if (!(await this.ueService.isUEAnnalSender(user.id, annalId))) throw new AppException(ERROR_CODE.NOT_ANNAL_SENDER);
    if ((await this.ueService.getUEAnnal(annalId, user.id)).status !== CommentStatus.PROCESSING)
      throw new AppException(ERROR_CODE.ANNAL_ALREADY_UPLOADED);
    const rotation = Number(rotate);
    return this.ueService.uploadAnnalFile(
      await file,
      annalId,
      isNaN(rotation) || rotation < -1 || rotation > 1 ? 0 : (rotation as -1 | 0 | 1),
    );
  }

  @Get('/:ueCode/annals')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async getUeAnnalList(@Param('ueCode') ueCode: string, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.ueService.getUEAnnalsList(user, ueCode, user.permissions.includes('annalModerator'));
  }

  @Get('/:ueCode/annals/:annalId')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async getUeAnnal(
    @Param('ueCode') ueCode: string,
    @UUIDParam('annalId') annalId: string,
    @GetUser() user: User,
    @Response() response: ExpressResponse,
  ) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.doesUEAnnalExist(user.id, ueCode, annalId, user.permissions.includes('annalModerator'))))
      throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId, ueCode);
    const annalFile = await this.ueService.getUEAnnalFile(
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

  @Patch('/:ueCode/annals/:annalId')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async updateUeAnnal(
    @Param('ueCode') ueCode: string,
    @UUIDParam('annalId') annalId: string,
    @Body() body: UpdateAnnal,
    @GetUser() user: User,
  ) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.doesUEAnnalExist(user.id, ueCode, annalId, user.permissions.includes('annalModerator'))))
      throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId, ueCode);
    if (!(await this.ueService.isUEAnnalSender(user.id, annalId)) && !user.permissions.includes('annalModerator'))
      throw new AppException(ERROR_CODE.NOT_ANNAL_SENDER);
    return this.ueService.updateAnnalMetadata(annalId, body);
  }

  @Delete('/:ueCode/annals/:annalId')
  @RequireRole('STUDENT', 'FORMER_STUDENT')
  async deleteUeAnnal(@Param('ueCode') ueCode: string, @UUIDParam('annalId') annalId: string, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.doesUEAnnalExist(user.id, ueCode, annalId, user.permissions.includes('annalModerator'))))
      throw new AppException(ERROR_CODE.NO_SUCH_ANNAL, annalId, ueCode);
    if (!(await this.ueService.isUEAnnalSender(user.id, annalId)) && !user.permissions.includes('annalModerator'))
      throw new AppException(ERROR_CODE.NOT_ANNAL_SENDER);
    return this.ueService.deleteAnnal(annalId);
  }

  // Routes to create
  // - Get lastValidatedBody from comment (for admins)
  // - Add lastSemester in comments
  // --- User report for : comments, replies, annals
  // -- Validation for : comments, annals
  // --- Display reports for : comments, replies, annals
  // -- Display pending validations for : comments, annals
}

import { Controller, Get, Query, Post, Body, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { UUIDParam } from '../../app.pipe';
import { RequireUserType, GetUser } from '../../auth/decorator';
import { AppException, ERROR_CODE } from '../../exceptions';
import { UECommentPostDto } from './dto/ue-comment-post.dto';
import { CommentReplyDto } from './dto/ue-comment-reply.dto';
import { UeCommentUpdateDto } from './dto/ue-comment-update.dto';
import { GetUECommentsDto } from './dto/ue-get-comments.dto';
import { UEService } from '../ue.service';
import { User } from '../../users/interfaces/user.interface';
import { CommentsService } from './comments.service';

@Controller('ue/comments')
export class CommentsController {
  constructor(readonly commentsService: CommentsService, readonly ueService: UEService) {}

  @Get()
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async getUEComments(@GetUser() user: User, @Query() dto: GetUECommentsDto) {
    if (!(await this.ueService.doesUEExist(dto.ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, dto.ueCode);
    return this.commentsService.getComments(user.id, dto, user.permissions.includes('commentModerator'));
  }

  @Post()
  @RequireUserType('STUDENT')
  async PostUEComment(@GetUser() user: User, @Body() body: UECommentPostDto) {
    if (!(await this.ueService.doesUEExist(body.ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, body.ueCode);
    if (!(await this.ueService.hasAlreadyDoneThisUE(user.id, body.ueCode)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    if (await this.commentsService.hasAlreadyPostedAComment(user.id, body.ueCode))
      throw new AppException(ERROR_CODE.FORBIDDEN_ALREADY_COMMENTED);
    return this.commentsService.createComment(body, user.id);
  }

  @Get(':commentId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async getUECommentFromId(@UUIDParam('commentId') commentId: string, @GetUser() user: User) {
    const comment = await this.commentsService.getCommentFromId(
      commentId,
      user.id,
      user.permissions.includes('commentModerator'),
    );
    if (!comment) throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    return comment;
  }

  @Patch(':commentId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async EditUEComment(
    @UUIDParam('commentId') commentId: string,
    @GetUser() user: User,
    @Body() body: UeCommentUpdateDto,
  ) {
    if (
      !(await this.commentsService.doesCommentExist(
        commentId,
        user.id,
        user.permissions.includes('commentModerator'),
        user.permissions.includes('commentModerator'),
      ))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (
      (await this.commentsService.isUserCommentAuthor(
        user.id,
        commentId,
        user.permissions.includes('commentModerator'),
      )) ||
      user.permissions.includes('commentModerator')
    )
      return this.commentsService.updateComment(
        body,
        commentId,
        user.id,
        user.permissions.includes('commentModerator'),
      );
    throw new AppException(ERROR_CODE.NOT_COMMENT_AUTHOR);
  }

  @Delete(':commentId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async DiscardUEComment(@UUIDParam('commentId') commentId: string, @GetUser() user: User) {
    if (
      !(await this.commentsService.doesCommentExist(commentId, user.id, user.permissions.includes('commentModerator')))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (
      (await this.commentsService.isUserCommentAuthor(
        user.id,
        commentId,
        user.permissions.includes('commentModerator'),
      )) ||
      user.permissions.includes('commentModerator')
    )
      return this.commentsService.deleteComment(commentId, user.id);
    throw new AppException(ERROR_CODE.NOT_COMMENT_AUTHOR);
  }

  @Post(':commentId/upvote')
  @RequireUserType('STUDENT')
  @HttpCode(HttpStatus.OK)
  async UpvoteUEComment(@UUIDParam('commentId') commentId: string, @GetUser() user: User) {
    if (
      !(await this.commentsService.doesCommentExist(
        commentId,
        user.id,
        user.permissions.includes('commentModerator'),
        user.permissions.includes('commentModerator'),
      ))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (
      await this.commentsService.isUserCommentAuthor(user.id, commentId, user.permissions.includes('commentModerator'))
    )
      throw new AppException(ERROR_CODE.IS_COMMENT_AUTHOR);
    if (await this.commentsService.hasAlreadyUpvoted(user.id, commentId))
      throw new AppException(ERROR_CODE.FORBIDDEN_ALREADY_UPVOTED);
    await this.commentsService.upvoteComment(user.id, commentId);
    return { upvoted: true };
  }

  @Delete(':commentId/upvote')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  @HttpCode(HttpStatus.OK)
  async UnUpvoteUEComment(@UUIDParam('commentId') commentId: string, @GetUser() user: User) {
    if (
      !(await this.commentsService.doesCommentExist(
        commentId,
        user.id,
        user.permissions.includes('commentModerator'),
        user.permissions.includes('commentModerator'),
      ))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (
      await this.commentsService.isUserCommentAuthor(user.id, commentId, user.permissions.includes('commentModerator'))
    )
      throw new AppException(ERROR_CODE.IS_COMMENT_AUTHOR);
    if (!(await this.commentsService.hasAlreadyUpvoted(user.id, commentId)))
      throw new AppException(ERROR_CODE.FORBIDDEN_ALREADY_UNUPVOTED);
    await this.commentsService.deUpvoteComment(user.id, commentId);
    return { upvoted: false };
  }

  @Post(':commentId/reply')
  @RequireUserType('STUDENT')
  async CreateReplyComment(
    @GetUser() user: User,
    @UUIDParam('commentId') commentId: string,
    @Body() body: CommentReplyDto,
  ) {
    if (
      !(await this.commentsService.doesCommentExist(
        commentId,
        user.id,
        user.permissions.includes('commentModerator'),
        user.permissions.includes('commentModerator'),
      ))
    )
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    return this.commentsService.replyComment(user.id, commentId, body);
  }

  @Patch('reply/:replyId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async EditReplyComment(@GetUser() user: User, @UUIDParam('replyId') replyId: string, @Body() body: CommentReplyDto) {
    if (!(await this.commentsService.doesReplyExist(replyId))) throw new AppException(ERROR_CODE.NO_SUCH_REPLY);
    if (
      (await this.commentsService.isUserCommentReplyAuthor(user.id, replyId)) ||
      user.permissions.includes('commentModerator')
    )
      return this.commentsService.editReply(replyId, body);
    throw new AppException(ERROR_CODE.NOT_REPLY_AUTHOR);
  }

  @Delete('reply/:replyId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  async DeleteReplyComment(@GetUser() user: User, @UUIDParam('replyId') replyId: string) {
    if (!(await this.commentsService.doesReplyExist(replyId))) throw new AppException(ERROR_CODE.NO_SUCH_REPLY);
    if (
      (await this.commentsService.isUserCommentReplyAuthor(user.id, replyId)) ||
      user.permissions.includes('commentModerator')
    )
      return this.commentsService.deleteReply(replyId);
    throw new AppException(ERROR_CODE.NOT_REPLY_AUTHOR);
  }
}

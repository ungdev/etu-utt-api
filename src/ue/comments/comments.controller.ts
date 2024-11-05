import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Query } from '@nestjs/common';
import { UUIDParam } from '../../app.pipe';
import { GetUser, RequireUserType } from '../../auth/decorator';
import { AppException, ERROR_CODE } from '../../exceptions';
import UeCommentPostReqDto from './dto/req/ue-comment-post-req.dto';
import CommentReplyReqDto from './dto/req/ue-comment-reply-req.dto';
import UeCommentUpdateReqDto from './dto/req/ue-comment-update-req.dto';
import GetUeCommentsReqDto from './dto/req/ue-get-comments-req.dto';
import { UeService } from '../ue.service';
import { User } from '../../users/interfaces/user.interface';
import { CommentsService } from './comments.service';
import UeCommentResDto from './dto/res/ue-comment-res.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAppErrorResponse, paginatedResponseDto } from '../../app.dto';
import { UeCommentUpvoteResDto$False, UeCommentUpvoteResDto$True } from './dto/res/ue-comment-upvote-res.dto';
import UeCommentReplyResDto from './dto/res/ue-comment-reply-res.dto';
import { Permission } from '@prisma/client';
import { GetPermissions } from '../../auth/decorator/get-permissions.decorator';
import { RequestPermissions } from '../../auth/interfaces/request-auth-data.interface';
import { Pagination } from '../../types';

@Controller('ue/comments')
@ApiTags('UE Comment')
export class CommentsController {
  constructor(readonly commentsService: CommentsService, readonly ueService: UeService) {}

  @Get()
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  @ApiOperation({ description: 'Get the comments of a UE. This route is paginated.' })
  @ApiOkResponse({ type: paginatedResponseDto(UeCommentResDto) })
  @ApiAppErrorResponse(
    ERROR_CODE.NO_SUCH_UE,
    'This error is sent back when there is no UE associated with the code provided.',
  )
  async getUEComments(
    @GetUser() user: User,
    @Query() dto: GetUeCommentsReqDto,
    @GetPermissions() permissions: RequestPermissions,
  ): Promise<Pagination<UeCommentResDto>> {
    if (!(await this.ueService.doesUeExist(dto.ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, dto.ueCode);
    return this.commentsService.getComments(user.id, dto, permissions[Permission.API_MODERATE_COMMENTS] === '*');
  }

  @Post()
  @RequireUserType('STUDENT')
  @ApiOperation({ description: 'Send a comment for a UE.' })
  @ApiOkResponse({ type: UeCommentResDto })
  @ApiAppErrorResponse(
    ERROR_CODE.NO_SUCH_UE,
    'This error is sent back when there is no UE associated with the code provided.',
  )
  @ApiAppErrorResponse(
    ERROR_CODE.NOT_ALREADY_DONE_UE,
    'The user must have already done the UE to post a comment about it.',
  )
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ALREADY_COMMENTED,
    'Thrown when user has already posted a comment about this UE.',
  )
  async PostUEComment(@GetUser() user: User, @Body() body: UeCommentPostReqDto): Promise<UeCommentResDto> {
    if (!(await this.ueService.doesUeExist(body.ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, body.ueCode);
    if (!(await this.ueService.hasAlreadyDoneThisUe(user.id, body.ueCode)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    if (await this.commentsService.hasAlreadyPostedAComment(user.id, body.ueCode))
      throw new AppException(ERROR_CODE.FORBIDDEN_ALREADY_COMMENTED);
    return this.commentsService.createComment(body, user.id);
  }

  // TODO : en vrai la route GET /ue/comments renvoie les mêmes infos nan ? :sweat_smile:
  @Get(':commentId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  @ApiOperation({ description: 'Fetch a specific comment.' })
  @ApiOkResponse({ type: UeCommentResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_COMMENT, 'No comment is associated with the given commentId')
  async getUECommentFromId(
    @UUIDParam('commentId') commentId: string,
    @GetUser() user: User,
    @GetPermissions() permissions: RequestPermissions,
  ): Promise<UeCommentResDto> {
    const comment = await this.commentsService.getCommentFromId(
      commentId,
      user.id,
      permissions[Permission.API_MODERATE_COMMENTS] === '*',
    );
    if (!comment) throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    return comment;
  }

  @Patch(':commentId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  @ApiOperation({ description: 'Edit a comment.' })
  @ApiOkResponse({ type: UeCommentResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_COMMENT, 'No comment has the given commentId.')
  @ApiAppErrorResponse(
    ERROR_CODE.NOT_COMMENT_AUTHOR,
    'The user is not the author of the comment, and does not have the `commentModerator` permission.',
  )
  async EditUEComment(
    @UUIDParam('commentId') commentId: string,
    @GetUser() user: User,
    @Body() body: UeCommentUpdateReqDto,
    @GetPermissions() permissions: RequestPermissions,
  ): Promise<UeCommentResDto> {
    const isCommentModerator = permissions[Permission.API_MODERATE_COMMENTS] === '*';
    if (!(await this.commentsService.doesCommentExist(commentId, user.id, isCommentModerator, isCommentModerator)))
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (isCommentModerator || (await this.commentsService.isUserCommentAuthor(user.id, commentId)))
      return this.commentsService.updateComment(body, commentId, user.id, isCommentModerator);
    throw new AppException(ERROR_CODE.NOT_COMMENT_AUTHOR);
  }

  @Delete(':commentId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  @ApiOperation({
    description: 'Delete a comment. The user must be the author or have the `commentModerator` permission.',
  })
  @ApiOkResponse({ type: UeCommentResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_COMMENT, 'No comment has the given commentId.')
  @ApiAppErrorResponse(
    ERROR_CODE.NOT_COMMENT_AUTHOR,
    'The user is not the author of the comment and does not have the `commentModerator` permission.',
  )
  async DiscardUEComment(
    @UUIDParam('commentId') commentId: string,
    @GetUser() user: User,
    @GetPermissions() permissions: RequestPermissions,
  ): Promise<UeCommentResDto> {
    const isCommentModerator = permissions[Permission.API_MODERATE_COMMENTS] === '*';
    if (!(await this.commentsService.doesCommentExist(commentId, user.id, isCommentModerator)))
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if ((await this.commentsService.isUserCommentAuthor(user.id, commentId)) || isCommentModerator)
      return this.commentsService.deleteComment(commentId, user.id);
    throw new AppException(ERROR_CODE.NOT_COMMENT_AUTHOR);
  }

  @Post(':commentId/upvote')
  @RequireUserType('STUDENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description: 'Give an upvote for a comment. User cannot be the author. Each user can only upvote a comment once.',
  })
  @ApiOkResponse({ type: UeCommentUpvoteResDto$True })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_COMMENT, 'There is no comment with the provided commentId.')
  @ApiAppErrorResponse(ERROR_CODE.IS_COMMENT_AUTHOR, 'Thrown when user is the author of the comment.')
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_ALREADY_UPVOTED,
    'Thrown when user tries to upvote the comment for a second time.',
  )
  async UpvoteUEComment(
    @UUIDParam('commentId') commentId: string,
    @GetUser() user: User,
    @GetPermissions() permissions: RequestPermissions,
  ): Promise<UeCommentUpvoteResDto$True> {
    const commentModerator = permissions[Permission.API_MODERATE_COMMENTS] === '*';
    if (!(await this.commentsService.doesCommentExist(commentId, user.id, commentModerator, commentModerator)))
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (await this.commentsService.isUserCommentAuthor(user.id, commentId))
      throw new AppException(ERROR_CODE.IS_COMMENT_AUTHOR);
    if (await this.commentsService.hasAlreadyUpvoted(user.id, commentId))
      throw new AppException(ERROR_CODE.FORBIDDEN_ALREADY_UPVOTED);
    await this.commentsService.upvoteComment(user.id, commentId);
    return { upvoted: true };
  }

  @Delete(':commentId/upvote')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'Remove an upvote for a comment. User' })
  @ApiOkResponse({ type: UeCommentUpvoteResDto$False })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_COMMENT, 'There is no comment with the provided commentId.')
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_NOT_UPVOTED,
    'Thrown when user tries to un-upvote a comment he did not upvote.',
  )
  async UnUpvoteUEComment(
    @UUIDParam('commentId') commentId: string,
    @GetUser() user: User,
    @GetPermissions() permissions: RequestPermissions,
  ): Promise<UeCommentUpvoteResDto$False> {
    const commentModerator = permissions[Permission.API_MODERATE_COMMENTS] === '*';
    if (!(await this.commentsService.doesCommentExist(commentId, user.id, commentModerator, commentModerator)))
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    // TODO : on est d'accord qu'on peut virer cette condition ? Puisque de toutes manières l'utilisateur ne peut pas mettre un upvote.
    if (await this.commentsService.isUserCommentAuthor(user.id, commentId))
      throw new AppException(ERROR_CODE.IS_COMMENT_AUTHOR);
    if (!(await this.commentsService.hasAlreadyUpvoted(user.id, commentId)))
      throw new AppException(ERROR_CODE.FORBIDDEN_NOT_UPVOTED);
    await this.commentsService.deUpvoteComment(user.id, commentId);
    return { upvoted: false };
  }

  @Post(':commentId/reply')
  @RequireUserType('STUDENT')
  @ApiOperation({ description: 'Reply to a comment.' })
  @ApiOkResponse({ type: UeCommentReplyResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_COMMENT, 'There is no comment with the provided commentId.')
  async CreateReplyComment(
    @GetUser() user: User,
    @UUIDParam('commentId') commentId: string,
    @Body() body: CommentReplyReqDto,
    @GetPermissions() permissions: RequestPermissions,
  ): Promise<UeCommentReplyResDto> {
    const isCommentModerator = permissions[Permission.API_MODERATE_COMMENTS] === '*';
    if (!(await this.commentsService.doesCommentExist(commentId, user.id, isCommentModerator, isCommentModerator)))
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    return this.commentsService.replyComment(user.id, commentId, body);
  }

  @Patch('reply/:replyId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  @ApiOperation({
    description:
      'Edit a reply to a comment. The user must be the author of the reply or have the `commentModerator` permission.',
  })
  @ApiOkResponse({ type: UeCommentReplyResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_REPLY, 'There is no reply with the provided replyId.')
  @ApiAppErrorResponse(ERROR_CODE.NOT_REPLY_AUTHOR, 'User is neither the author of the reply nor a `commentModerator`.')
  async EditReplyComment(
    @GetUser() user: User,
    @UUIDParam('replyId') replyId: string,
    @Body() body: CommentReplyReqDto,
    @GetPermissions() permissions: RequestPermissions,
  ): Promise<UeCommentReplyResDto> {
    if (!(await this.commentsService.doesReplyExist(replyId))) throw new AppException(ERROR_CODE.NO_SUCH_REPLY);
    if (
      (await this.commentsService.isUserCommentReplyAuthor(user.id, replyId)) ||
      permissions[Permission.API_MODERATE_COMMENTS] === '*'
    )
      return this.commentsService.editReply(replyId, body);
    throw new AppException(ERROR_CODE.NOT_REPLY_AUTHOR);
  }

  @Delete('reply/:replyId')
  @RequireUserType('STUDENT', 'FORMER_STUDENT')
  @ApiOperation({
    description:
      'Delete a reply to a comment. The user must be the author of the reply or have the `commentModerator` permission.',
  })
  @ApiOkResponse({ type: UeCommentReplyResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_REPLY, 'There is no reply with the provided replyId.')
  @ApiAppErrorResponse(ERROR_CODE.NOT_REPLY_AUTHOR, 'User is neither the author of the reply nor a `commentModerator`.')
  async DeleteReplyComment(
    @GetUser() user: User,
    @UUIDParam('replyId') replyId: string,
    @GetPermissions() permissions: RequestPermissions,
  ): Promise<UeCommentReplyResDto> {
    if (!(await this.commentsService.doesReplyExist(replyId))) throw new AppException(ERROR_CODE.NO_SUCH_REPLY);
    if (
      (await this.commentsService.isUserCommentReplyAuthor(user.id, replyId)) ||
      permissions[Permission.API_MODERATE_COMMENTS] === '*'
    )
      return this.commentsService.deleteReply(replyId);
    throw new AppException(ERROR_CODE.NOT_REPLY_AUTHOR);
  }
}

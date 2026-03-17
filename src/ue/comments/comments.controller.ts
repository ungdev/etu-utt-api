import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '../../prisma/types';
import { ApiAppErrorResponse, paginatedResponseDto } from '../../app.dto';
import { UUIDParam } from '../../app.pipe';
import { GetUser, RequireApiPermission } from '../../auth/decorator';
import { GetPermissions } from '../../auth/decorator/get-permissions.decorator';
import { AppException, ERROR_CODE } from '../../exceptions';
import { User } from '../../users/interfaces/user.interface';
import { PermissionManager } from '../../utils';
import { UeService } from '../ue.service';
import { CommentsService } from './comments.service';
import UeCommentPostReqDto from './dto/req/ue-comment-post-req.dto';
import UeCommentReplyReqDto from './dto/req/ue-comment-reply-req.dto';
import UeCommentReportReqDto from './dto/req/ue-comment-report-req.dto';
import UeCommentUpdateReqDto from './dto/req/ue-comment-update-req.dto';
import GetUeCommentsReqDto from './dto/req/ue-get-comments-req.dto';
import GetReportedCommentsReqDto from './dto/req/ue-get-reported-comments-req.dto';
import UeCommentReplyResDto from './dto/res/ue-comment-reply-res.dto';
import UeCommentReportReasonResDto from './dto/res/ue-comment-report-reason-res.dto';
import UeCommentReportResDto from './dto/res/ue-comment-report-res.dto';
import UeCommentResDto from './dto/res/ue-comment-res.dto';
import { UeCommentUpvoteResDto$False, UeCommentUpvoteResDto$True } from './dto/res/ue-comment-upvote-res.dto';

@Controller('ue/comments')
@ApiTags('UE Comment')
export class CommentsController {
  constructor(
    readonly commentsService: CommentsService,
    readonly ueService: UeService,
  ) {}

  @Get()
  @RequireApiPermission(Permission.API_SEE_OPINIONS_UE)
  @ApiOperation({ description: 'Get the comments of a UE. This route is paginated.' })
  @ApiOkResponse({ type: paginatedResponseDto(UeCommentResDto) })
  @ApiAppErrorResponse(
    ERROR_CODE.NO_SUCH_UE,
    'This error is sent back when there is no UE associated with the code provided.',
  )
  async getUeComments(
    @GetUser() user: User,
    @Query() dto: GetUeCommentsReqDto,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<Pagination<UeCommentResDto>> {
    if (!(await this.ueService.doesUeExist(dto.ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, dto.ueCode);
    return this.commentsService.getComments(user.id, dto, permissions.can(Permission.API_MODERATE_COMMENTS));
  }

  @Post()
  @RequireApiPermission('API_GIVE_OPINIONS_UE')
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
  async PostUeComment(@GetUser() user: User, @Body() body: UeCommentPostReqDto): Promise<UeCommentResDto> {
    // FIXME : a user can only post one comment per ue (among all ueofs)
    if (!(await this.ueService.doesUeExist(body.ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, body.ueCode);
    if (!(await this.ueService.hasUserAttended(body.ueCode, user.id)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    if (await this.commentsService.hasAlreadyPostedAComment(user.id, body.ueCode))
      throw new AppException(ERROR_CODE.FORBIDDEN_ALREADY_COMMENTED);
    return this.commentsService.createComment(body, user.id);
  }

  @Get('/reports')
  @RequireApiPermission('API_MODERATE_COMMENTS')
  @ApiOperation({ description: 'Get all reported comments or comments with reported replies. This route is paginated' })
  @ApiOkResponse({ type: paginatedResponseDto(UeCommentResDto) })
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS,
    "Thrown when the user doesn't have enough permissions",
  )
  getReportedComments(
    @GetUser() user: User,
    @Query() dto: GetReportedCommentsReqDto,
  ): Promise<Pagination<UeCommentResDto>> {
    return this.commentsService.getCommentsWithReports(user.id, dto);
  }

  @Get('/reports/reasons')
  @RequireApiPermission('API_SEE_OPINIONS_UE')
  @ApiOperation({ description: 'Get the list of all possible report reasons' })
  @ApiOkResponse({ type: UeCommentReportReasonResDto, isArray: true })
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS,
    "Thrown when the user doesn't have enough permissions",
  )
  getReportReasons(): Promise<UeCommentReportReasonResDto[]> {
    return this.commentsService.getCommentReportReason();
  }

  // TODO : en vrai la route GET /ue/comments renvoie les mêmes infos nan ? :sweat_smile:
  @Get(':commentId')
  @RequireApiPermission('API_SEE_OPINIONS_UE')
  @ApiOperation({ description: 'Fetch a specific comment.' })
  @ApiOkResponse({ type: UeCommentResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_COMMENT, 'No comment is associated with the given commentId')
  async getUeCommentFromId(
    @UUIDParam('commentId') commentId: string,
    @GetUser() user: User,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<UeCommentResDto> {
    const comment = await this.commentsService.getCommentFromId(
      commentId,
      user.id,
      permissions.can(Permission.API_MODERATE_COMMENTS),
    );
    if (!comment) throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    return comment;
  }

  @Patch(':commentId')
  @RequireApiPermission('API_GIVE_OPINIONS_UE')
  @ApiOperation({ description: 'Edit a comment.' })
  @ApiOkResponse({ type: UeCommentResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_COMMENT, 'No comment has the given commentId.')
  @ApiAppErrorResponse(
    ERROR_CODE.NOT_COMMENT_AUTHOR,
    'The user is not the author of the comment, and does not have the `commentModerator` permission.',
  )
  async editUeComment(
    @UUIDParam('commentId') commentId: string,
    @GetUser() user: User,
    @Body() body: UeCommentUpdateReqDto,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<UeCommentResDto> {
    const isCommentModerator = permissions.can(Permission.API_MODERATE_COMMENTS);
    if (!(await this.commentsService.doesCommentExist(commentId, user.id, isCommentModerator)))
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (isCommentModerator || (await this.commentsService.isUserCommentAuthor(user.id, commentId)))
      return this.commentsService.updateComment(body, commentId, user.id, isCommentModerator);
    throw new AppException(ERROR_CODE.NOT_COMMENT_AUTHOR);
  }

  @Delete(':commentId')
  @RequireApiPermission('API_GIVE_OPINIONS_UE')
  @ApiOperation({
    description: 'Delete a comment. The user must be the author or have the `commentModerator` permission.',
  })
  @ApiOkResponse({ type: UeCommentResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_COMMENT, 'No comment has the given commentId.')
  @ApiAppErrorResponse(
    ERROR_CODE.NOT_COMMENT_AUTHOR,
    'The user is not the author of the comment and does not have the `commentModerator` permission.',
  )
  async discardUeComment(
    @UUIDParam('commentId') commentId: string,
    @GetUser() user: User,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<UeCommentResDto> {
    const isCommentModerator = permissions.can(Permission.API_MODERATE_COMMENTS);
    if (!(await this.commentsService.doesCommentExist(commentId, user.id, isCommentModerator)))
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if ((await this.commentsService.isUserCommentAuthor(user.id, commentId)) || isCommentModerator)
      return this.commentsService.deleteComment(commentId, user.id);
    throw new AppException(ERROR_CODE.NOT_COMMENT_AUTHOR);
  }

  @Post(':commentId/upvote')
  @RequireApiPermission('API_GIVE_OPINIONS_UE')
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
  async UpvoteUeComment(
    @UUIDParam('commentId') commentId: string,
    @GetUser() user: User,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<UeCommentUpvoteResDto$True> {
    const commentModerator = permissions.can(Permission.API_MODERATE_COMMENTS);
    if (!(await this.commentsService.doesCommentExist(commentId, user.id, commentModerator)))
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (await this.commentsService.isUserCommentAuthor(user.id, commentId))
      throw new AppException(ERROR_CODE.IS_COMMENT_AUTHOR);
    if (await this.commentsService.hasAlreadyUpvoted(user.id, commentId))
      throw new AppException(ERROR_CODE.FORBIDDEN_ALREADY_UPVOTED);
    await this.commentsService.upvoteComment(user.id, commentId);
    return { upvoted: true };
  }

  @Delete(':commentId/upvote')
  @RequireApiPermission('API_GIVE_OPINIONS_UE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'Remove an upvote for a comment. User' })
  @ApiOkResponse({ type: UeCommentUpvoteResDto$False })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_COMMENT, 'There is no comment with the provided commentId.')
  @ApiAppErrorResponse(
    ERROR_CODE.FORBIDDEN_NOT_UPVOTED,
    'Thrown when user tries to un-upvote a comment he did not upvote.',
  )
  async UnUpvoteUeComment(
    @UUIDParam('commentId') commentId: string,
    @GetUser() user: User,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<UeCommentUpvoteResDto$False> {
    const commentModerator = permissions.can(Permission.API_MODERATE_COMMENTS);
    if (!(await this.commentsService.doesCommentExist(commentId, user.id, commentModerator)))
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
  @RequireApiPermission('API_GIVE_OPINIONS_UE')
  @ApiOperation({ description: 'Reply to a comment.' })
  @ApiOkResponse({ type: UeCommentReplyResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_COMMENT, 'There is no comment with the provided commentId.')
  async createReplyComment(
    @GetUser() user: User,
    @UUIDParam('commentId') commentId: string,
    @Body() body: UeCommentReplyReqDto,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<UeCommentReplyResDto> {
    const isCommentModerator = permissions.can(Permission.API_MODERATE_COMMENTS);
    if (!(await this.commentsService.doesCommentExist(commentId, user.id, isCommentModerator)))
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    return this.commentsService.replyComment(user.id, commentId, body);
  }

  @Patch('reply/:replyId')
  @RequireApiPermission('API_GIVE_OPINIONS_UE')
  @ApiOperation({
    description:
      'Edit a reply to a comment. The user must be the author of the reply or have the `commentModerator` permission.',
  })
  @ApiOkResponse({ type: UeCommentReplyResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_REPLY, 'There is no reply with the provided replyId.')
  @ApiAppErrorResponse(ERROR_CODE.NOT_REPLY_AUTHOR, 'User is neither the author of the reply nor a `commentModerator`.')
  async editReplyComment(
    @GetUser() user: User,
    @UUIDParam('replyId') replyId: string,
    @Body() body: UeCommentReplyReqDto,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<UeCommentReplyResDto> {
    if (!(await this.commentsService.doesReplyExist(replyId))) throw new AppException(ERROR_CODE.NO_SUCH_REPLY);
    if (
      (await this.commentsService.isUserCommentReplyAuthor(user.id, replyId)) ||
      permissions.can(Permission.API_MODERATE_COMMENTS)
    )
      return this.commentsService.editReply(replyId, body);
    throw new AppException(ERROR_CODE.NOT_REPLY_AUTHOR);
  }

  @Delete('reply/:replyId')
  @RequireApiPermission('API_GIVE_OPINIONS_UE')
  @ApiOperation({
    description:
      'Delete a reply to a comment. The user must be the author of the reply or have the `commentModerator` permission.',
  })
  @ApiOkResponse({ type: UeCommentReplyResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_REPLY, 'There is no reply with the provided replyId.')
  @ApiAppErrorResponse(ERROR_CODE.NOT_REPLY_AUTHOR, 'User is neither the author of the reply nor a `commentModerator`.')
  async deleteReplyComment(
    @GetUser() user: User,
    @UUIDParam('replyId') replyId: string,
    @GetPermissions() permissions: PermissionManager,
  ): Promise<UeCommentReplyResDto> {
    if (!(await this.commentsService.doesReplyExist(replyId))) throw new AppException(ERROR_CODE.NO_SUCH_REPLY);
    if (
      (await this.commentsService.isUserCommentReplyAuthor(user.id, replyId)) ||
      permissions.can(Permission.API_MODERATE_COMMENTS)
    )
      return this.commentsService.deleteReply(replyId);
    throw new AppException(ERROR_CODE.NOT_REPLY_AUTHOR);
  }

  @Post(':commentId/report')
  @RequireApiPermission('API_SEE_OPINIONS_UE')
  @ApiOperation({ description: 'Report a comment' })
  @ApiOkResponse({ type: UeCommentReportResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_COMMENT, 'there is no comment with the provided commentId')
  @ApiAppErrorResponse(ERROR_CODE.IS_COMMENT_AUTHOR, 'thrown when the user is the comment author')
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_REPORT_REASON, 'the provided reason does not exist')
  async reportComment(
    @GetUser() user: User,
    @UUIDParam('commentId') commentId: string,
    @Body() body: UeCommentReportReqDto,
    @GetPermissions() permissions: PermissionManager,
  ) {
    const commentModerator = permissions.can('API_MODERATE_COMMENTS');
    if (!(await this.commentsService.doesCommentExist(commentId, user.id, commentModerator)))
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (await this.commentsService.isUserCommentAuthor(user.id, commentId))
      throw new AppException(ERROR_CODE.IS_COMMENT_AUTHOR);
    if (!(await this.commentsService.doesReportReasonExist(body.reason)))
      throw new AppException(ERROR_CODE.NO_SUCH_REPORT_REASON);
    return this.commentsService.reportComment(user.id, body, commentId, commentModerator);
  }

  @Post('reply/:replyId/report')
  @RequireApiPermission('API_SEE_OPINIONS_UE')
  @ApiOperation({ description: 'Report a comment reply' })
  @ApiOkResponse({ type: UeCommentReportResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_REPLY, 'there is no comment reply with the provided replyId')
  @ApiAppErrorResponse(ERROR_CODE.IS_COMMENT_AUTHOR, 'thrown when the user is the comment author')
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_REPORT_REASON, 'the provided reason does not exist')
  async reportCommentReply(
    @GetUser() user: User,
    @UUIDParam('replyId') replyId: string,
    @Body() body: UeCommentReportReqDto,
  ) {
    if (!(await this.commentsService.doesReplyExist(replyId))) throw new AppException(ERROR_CODE.NO_SUCH_REPLY);
    if (await this.commentsService.isUserCommentReplyAuthor(user.id, replyId))
      throw new AppException(ERROR_CODE.IS_COMMENT_AUTHOR);
    if (!(await this.commentsService.doesReportReasonExist(body.reason)))
      throw new AppException(ERROR_CODE.NO_SUCH_REPORT_REASON);
    return this.commentsService.reportCommentReply(user.id, body, replyId);
  }

  @Patch(':commentId/:reportId')
  @RequireApiPermission('API_MODERATE_COMMENTS')
  @ApiOperation({ description: 'Mitigate a report' })
  @ApiOkResponse({ type: UeCommentReportResDto })
  async mitigateCommentReport(
    @GetUser() user: User,
    @UUIDParam('commentId') commentId: string,
    @UUIDParam('reportId') reportId: string,
  ) {
    if (!(await this.commentsService.doesCommentExist(commentId, user.id, true)))
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (!(await this.commentsService.doesCommentReportExist(reportId)))
      throw new AppException(ERROR_CODE.NO_SUCH_REPORT);
    return this.commentsService.mitigateCommentReport(commentId, reportId);
  }

  @Patch('/reply/:replyId/:reportId')
  @RequireApiPermission('API_MODERATE_COMMENTS')
  @ApiOperation({ description: 'Mitigate a comment reply report' })
  @ApiOkResponse({ type: UeCommentReportResDto })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_REPLY, 'Thrown when the comment reply does not exist')
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_REPORT, 'Thrown when the report does not exist')
  async mitigateCommentReplyReport(@UUIDParam('replyId') replyId: string, @UUIDParam('reportId') reportId: string) {
    if (!(await this.commentsService.doesReplyExist(replyId))) throw new AppException(ERROR_CODE.NO_SUCH_REPLY);
    if (!(await this.commentsService.doesCommentReplyReportExist(reportId)))
      throw new AppException(ERROR_CODE.NO_SUCH_REPORT);
    return this.commentsService.mitigateCommentReplyReport(replyId, reportId);
  }
}

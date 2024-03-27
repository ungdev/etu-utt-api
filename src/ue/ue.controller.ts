import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UESearchDto } from './dto/ue-search.dto';
import { UEService } from './ue.service';
import { GetUser, IsPublic } from '../auth/decorator';
import { User } from '../users/interfaces/user.interface';
import { UeCommentPostDto } from './dto/ue-comment-post.dto';
import { AppException, ERROR_CODE } from '../exceptions';
import { UERateDto } from './dto/ue-rate.dto';
import { UeCommentUpdateDto } from './dto/ue-comment-update.dto';
import { CommentReplyDto } from './dto/ue-comment-reply.dto';
import { GetUECommentsDto } from './dto/ue-get-comments.dto';
import { UE } from './interfaces/ue-detail.interface';

@Controller('ue')
export class UEController {
  constructor(readonly ueService: UEService) {}

  @Get()
  @IsPublic()
  async searchUE(@Query() queryParams: UESearchDto): Promise<Pagination<UEOverview>> {
    const res = await this.ueService.searchUEs(queryParams);
    return {
      ...res,
      items: res.items.map((ue) => this.formatUEOverview(ue)),
    };
  }

  @Get('/:ueCode')
  @IsPublic()
  async getUE(@Param('ueCode') ueCode: string): Promise<UEDetail> {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.formatDetailedUE(await this.ueService.getUE(ueCode.toUpperCase()));
  }

  @Get('/:ueCode/comments')
  async getUEComments(@Param('ueCode') ueCode: string, @GetUser() user: User, @Query() dto: GetUECommentsDto) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.ueService.getComments(ueCode, user.id, dto, user.permissions.includes('commentModerator'));
  }

  @Post('/:ueCode/comments')
  async PostUEComment(@Param('ueCode') ueCode: string, @GetUser() user: User, @Body() body: UeCommentPostDto) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.hasAlreadyDoneThisUE(user.id, ueCode)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    if (await this.ueService.hasAlreadyPostedAComment(user.id, ueCode))
      throw new AppException(ERROR_CODE.FORBIDDEN_ALREADY_COMMENTED);
    return this.ueService.createComment(body, user.id, ueCode);
  }

  @Get('/comments/:commentId')
  async getUECommentFromId(
    @Param(
      'commentId',
      new ParseUUIDPipe({ exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'commentId') }),
    )
    commentId: string,
    @GetUser() user: User,
  ) {
    const comment = await this.ueService.getCommentFromId(
      commentId,
      user.id,
      user.permissions.includes('commentModerator'),
    );
    if (!comment) {
      throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    }
    return comment;
  }

  @Patch('/comments/:commentId')
  async EditUEComment(
    @Param(
      'commentId',
      new ParseUUIDPipe({
        exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'commentId'),
      }),
    )
    commentId: string,
    @GetUser() user: User,
    @Body() body: UeCommentUpdateDto,
  ) {
    if (!(await this.ueService.doesCommentExist(commentId))) throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (await this.ueService.isUserCommentAuthor(user.id, commentId))
      return this.ueService.updateComment(body, commentId, user.id);
    throw new AppException(ERROR_CODE.NOT_COMMENT_AUTHOR);
  }

  @Delete('/comments/:commentId')
  async DiscardUEComment(
    @Param(
      'commentId',
      new ParseUUIDPipe({
        exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'commentId'),
      }),
    )
    commentId: string,
    @GetUser() user: User,
  ) {
    if (!(await this.ueService.doesCommentExist(commentId))) throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (await this.ueService.isUserCommentAuthor(user.id, commentId))
      return this.ueService.deleteComment(commentId, user.id);
    throw new AppException(ERROR_CODE.NOT_COMMENT_AUTHOR);
  }

  @Post('/comments/:commentId/upvote')
  @HttpCode(HttpStatus.OK)
  async UpvoteUEComment(
    @Param(
      'commentId',
      new ParseUUIDPipe({
        exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'commentId'),
      }),
    )
    commentId: string,
    @GetUser() user: User,
  ) {
    if (!(await this.ueService.doesCommentExist(commentId))) throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (await this.ueService.isUserCommentAuthor(user.id, commentId))
      throw new AppException(ERROR_CODE.IS_COMMENT_AUTHOR);
    if (await this.ueService.hasAlreadyUpvoted(user.id, commentId))
      throw new AppException(ERROR_CODE.FORBIDDEN_ALREADY_UPVOTED);
    await this.ueService.upvoteComment(user.id, commentId);
    return { upvoted: true };
  }

  @Delete('/comments/:commentId/upvote')
  @HttpCode(HttpStatus.OK)
  async UnUpvoteUEComment(
    @Param(
      'commentId',
      new ParseUUIDPipe({
        exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'commentId'),
      }),
    )
    commentId: string,
    @GetUser() user: User,
  ) {
    if (!(await this.ueService.doesCommentExist(commentId))) throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    if (await this.ueService.isUserCommentAuthor(user.id, commentId))
      throw new AppException(ERROR_CODE.IS_COMMENT_AUTHOR);
    if (!(await this.ueService.hasAlreadyUpvoted(user.id, commentId)))
      throw new AppException(ERROR_CODE.FORBIDDEN_ALREADY_UNUPVOTED);
    await this.ueService.deUpvoteComment(user.id, commentId);
    return { upvoted: false };
  }

  @Post('/comments/:commentId/reply')
  async CreateReplyComment(
    @GetUser() user: User,
    @Param(
      'commentId',
      new ParseUUIDPipe({
        exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'commentId'),
      }),
    )
    commentId: string,
    @Body() body: CommentReplyDto,
  ) {
    if (!(await this.ueService.doesCommentExist(commentId))) throw new AppException(ERROR_CODE.NO_SUCH_COMMENT);
    return this.ueService.replyComment(user.id, commentId, body);
  }

  @Patch('/comments/reply/:replyId')
  async EditReplyComment(
    @GetUser() user: User,
    @Param(
      'replyId',
      new ParseUUIDPipe({
        exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'replyId'),
      }),
    )
    replyId: string,
    @Body() body: CommentReplyDto,
  ) {
    if (!(await this.ueService.doesReplyExist(replyId))) throw new AppException(ERROR_CODE.NO_SUCH_REPLY);
    if (await this.ueService.isUserCommentReplyAuthor(user.id, replyId)) return this.ueService.editReply(replyId, body);
    throw new AppException(ERROR_CODE.NOT_REPLY_AUTHOR);
  }

  @Delete('/comments/reply/:replyId')
  async DeleteReplyComment(
    @GetUser() user: User,
    @Param(
      'replyId',
      new ParseUUIDPipe({
        exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, 'replyId'),
      }),
    )
    replyId: string,
  ) {
    if (!(await this.ueService.doesReplyExist(replyId))) throw new AppException(ERROR_CODE.NO_SUCH_REPLY);
    if (await this.ueService.isUserCommentReplyAuthor(user.id, replyId)) return this.ueService.deleteReply(replyId);
    throw new AppException(ERROR_CODE.NOT_REPLY_AUTHOR);
  }

  @Get('/rate/criteria')
  @IsPublic()
  async GetRateCriteria() {
    return this.ueService.getRateCriteria();
  }

  @Get('/:ueCode/rate')
  async GetRateUE(@Param('ueCode') ueCode: string, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.ueService.getRateUE(user.id, ueCode);
  }

  @Put('/:ueCode/rate')
  async RateUE(@Param('ueCode') ueCode: string, @GetUser() user: User, @Body() dto: UERateDto) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.doesCriterionExist(dto.criterion))) throw new AppException(ERROR_CODE.NO_SUCH_CRITERION);
    if (!(await this.ueService.hasAlreadyDoneThisUE(user.id, ueCode)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
    return this.ueService.doRateUE(user.id, ueCode, dto);
  }

  @Delete('/:ueCode/rate/:criterionId')
  async UnRateUE(@Param('ueCode') ueCode: string, @Param('criterionId') criterionId: string, @GetUser() user: User) {
    if (!(await this.ueService.doesUEExist(ueCode))) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    if (!(await this.ueService.doesCriterionExist(criterionId))) throw new AppException(ERROR_CODE.NO_SUCH_CRITERION);
    if (!(await this.ueService.hasAlreadyRated(user.id, ueCode, criterionId)))
      throw new AppException(ERROR_CODE.NOT_ALREADY_RATED_UE, ueCode, criterionId);
    return this.ueService.unRateUE(user.id, ueCode, criterionId);
  }

  /*
   * ADMIN ROUTES
   */
  // @Patch('/admin/comments/:commentId')
  // @RequirePermission(['commentModerator', 'admin'])
  // async UpdateUEComment(
  //   @Param('commentId') commentId: string,
  //   @Body() body: UeCommentPostDto,
  //   @GetUser() user: User,
  // ) {
  //   return this.ueService.updateComment(body, commentId, user);
  // }

  // @Delete('/admin/comments/:commentId')
  // @RequirePermission(['commentModerator', 'admin'])
  // async DeleteUEComment(
  //   @Param('commentId') commentId: string,
  //   @GetUser() user: User,
  // ) {
  //   return this.ueService.deleteComment(commentId, user);
  // }

  // @Patch('/admin/comments/reply/:replyId')
  // @RequirePermission(['commentModerator', 'admin'])
  // async UpdateUECommentReply(
  //   @Param('replyId') commentId: string,
  //   @Body() body: UeCommentPostDto,
  // ) {
  //   return this.ueService.editReply(commentId, body);
  // }

  // @Delete('/admin/comments/reply/:replyId')
  // @RequirePermission(['commentModerator', 'admin'])
  // async DeleteUECommentReply(@Param('replyId') replyId: string) {
  //   return this.ueService.deleteReply(replyId);
  // }

  private formatUEOverview(ue: UE): UEOverview {
    return {
      code: ue.code,
      inscriptionCode: ue.inscriptionCode,
      name: ue.name,
      credits: ue.credits.map((c) => ({
        credits: c.credits,
        category: {
          code: c.category.code,
          name: c.category.name,
        },
      })),
      branchOption: ue.branchOption.map((branchOption) => ({
        code: branchOption.code,
        name: branchOption.name,
        branch: {
          code: branchOption.branch.code,
          name: branchOption.branch.name,
        },
      })),
      info: {
        requirements: ue.info.requirements.map((r) => r.code),
        comment: ue.info.comment,
        degree: ue.info.degree,
        languages: ue.info.languages,
        minors: ue.info.minors,
        objectives: ue.info.objectives,
        program: ue.info.program,
      },
      openSemester: ue.openSemester.map((semester) => ({
        code: semester.code,
        start: semester.start,
        end: semester.end,
      })),
    };
  }

  private formatDetailedUE(ue: UE): UEDetail {
    return {
      code: ue.code,
      inscriptionCode: ue.inscriptionCode,
      name: ue.name,
      credits: ue.credits.map((c) => ({
        credits: c.credits,
        category: {
          code: c.category.code,
          name: c.category.name,
        },
      })),
      branchOption: ue.branchOption.map((branchOption) => ({
        code: branchOption.code,
        name: branchOption.name,
        branch: {
          code: branchOption.branch.code,
          name: branchOption.branch.name,
        },
      })),
      info: {
        requirements: ue.info.requirements.map((r) => r.code),
        comment: ue.info.comment,
        degree: ue.info.degree,
        languages: ue.info.languages,
        minors: ue.info.minors,
        objectives: ue.info.objectives,
        program: ue.info.program,
      },
      openSemester: ue.openSemester.map((semester) => ({
        code: semester.code,
        start: semester.start,
        end: semester.end,
      })),
      workTime: {
        cm: ue.workTime.cm,
        td: ue.workTime.td,
        tp: ue.workTime.tp,
        the: ue.workTime.the,
        project: ue.workTime.project,
        internship: ue.workTime.internship,
      },
      starVotes: ue.starVotes,
    };
  }
}

export type UEOverview = {
  code: string;
  inscriptionCode: string;
  name: string;
  credits: Array<{
    credits: number;
    category: {
      code: string;
      name: string;
    };
  }>;
  branchOption: Array<{
    branch: {
      code: string;
      name: string;
    };
    code: string;
    name: string;
  }>;
  info: {
    requirements: string[];
    comment: string;
    degree: string;
    languages: string;
    minors: string;
    objectives: string;
    program: string;
  };
  openSemester: Array<{
    code: string;
    start: Date;
    end: Date;
  }>;
};

export type UEDetail = {
  code: string;
  inscriptionCode: string;
  name: string;
  credits: Array<{
    credits: number;
    category: {
      code: string;
      name: string;
    };
  }>;
  branchOption: Array<{
    branch: {
      code: string;
      name: string;
    };
    code: string;
    name: string;
  }>;
  info: {
    requirements: string[];
    comment: string;
    degree: string;
    languages: string;
    minors: string;
    objectives: string;
    program: string;
  };
  openSemester: Array<{
    code: string;
    start: Date;
    end: Date;
  }>;
  workTime: {
    cm: number;
    td: number;
    tp: number;
    the: number;
    project: number;
    internship: number;
  };
  starVotes: { [criterionId: string]: number };
};

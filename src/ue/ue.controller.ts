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
} from '@nestjs/common';
import { UESearchDto } from './dto/ue-search.dto';
import { UEService } from './ue.service';
import { GetUser, RequirePermission } from 'src/auth/decorator';
import { User } from '@/prisma/types';
import { UeCommentPostDto } from './dto/ue-comment-post.dto';
import { AppException, ERROR_CODE } from 'src/exceptions';
import { UERateDto } from './dto/ue-rate.dto';
import { UeCommentUpdateDto } from './dto/ue-comment-update.dto';
import { CommentReplyDto } from './dto/ue-comment-reply.dto';
import { GetUECommentsDto } from './dto/ue-get-comments.dto';

@Controller('ue')
export class UEController {
  constructor(readonly ueService: UEService) {}

  @Get()
  async searchUE(@Query() queryParams: UESearchDto) {
    return this.ueService.searchUEs(queryParams);
  }

  @Get('/:ueCode')
  async getUE(@Param('ueCode') ueCode: string) {
    return this.ueService.getUE(ueCode.toUpperCase());
  }

  @Get('/:ueCode/comments')
  async getUEComments(
    @Param('ueCode') ueCode: string,
    @GetUser() user: User,
    @Query() dto: GetUECommentsDto,
  ) {
    return this.ueService.getComments(
      ueCode,
      user,
      dto,
      user.permissions.includes('commentModerator'),
    );
  }

  @Post('/:ueCode/comments')
  async PostUEComment(
    @Param('ueCode') ueCode: string,
    @GetUser() user: User,
    @Body() body: UeCommentPostDto,
  ) {
    if (await this.ueService.hasAlreadyDoneThisUE(user, ueCode)) {
      const comment = await this.ueService.createComment(body, user, ueCode);
      return {
        id: comment.id,
      };
    } else throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
  }

  @Patch('/comments/:commentId')
  async EditUEComment(
    @Param('commentId') commentId: string,
    @GetUser() user: User,
    @Body() body: UeCommentUpdateDto,
  ) {
    if (await this.ueService.isUserCommentAuthor(user, commentId))
      await this.ueService.updateComment(body, commentId);
    else throw new AppException(ERROR_CODE.NOT_COMMENT_AUTHOR);
  }

  @Put('/comments/:commentId/upvote')
  async UpvoteUEComment(
    @Param('commentId') commentId: string,
    @GetUser() user: User,
  ) {
    if (!(await this.ueService.hasAlreadyUpvoted(user, commentId)))
      await this.ueService.upvoteComment(user, commentId);
    else await this.ueService.deUpvoteComment(user, commentId);
  }

  @Post('/comments/:commentId/reply')
  async CreateReplyComment(
    @GetUser() user: User,
    @Param('commentId') commentId: string,
    @Body() body: CommentReplyDto,
  ) {
    return this.ueService.replyComment(user, commentId, body);
  }

  @Get('/rate/criteria')
  async GetRateCriteria() {
    return this.ueService.getRateCriteria();
  }

  @Get('/:ueCode/rate')
  async GetRateUE(@Param('ueCode') ueCode: string, @GetUser() user: User) {
    return this.ueService.getRateUE(user, ueCode);
  }

  @Put('/:ueCode/rate')
  async RateUE(
    @Param('ueCode') ueCode: string,
    @GetUser() user: User,
    @Body() dto: UERateDto,
  ) {
    if (await this.ueService.hasAlreadyDoneThisUE(user, ueCode)) {
      await this.ueService.doRateUE(user, ueCode, dto);
    } else throw new AppException(ERROR_CODE.NOT_ALREADY_DONE_UE);
  }

  /*
   * ADMIN ROUTES
   */
  @Patch('/admin/comments/:commentId')
  @RequirePermission(['commentModerator', 'admin'])
  async UpdateUEComment(
    @Param('commentId') commentId: string,
    @Body() body: UeCommentPostDto,
  ) {
    await this.ueService.updateComment(body, commentId);
  }

  @Delete('/admin/comments/:commentId')
  @RequirePermission(['commentModerator', 'admin'])
  async DeleteUEComment(@Param('commentId') commentId: string) {
    await this.ueService.deleteComment(commentId);
  }
}

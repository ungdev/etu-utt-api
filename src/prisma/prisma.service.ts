import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    });
  }

  cleanDb() {
    return this.$transaction([
      this.uECommentUpvote.deleteMany(),
      this.uEStarVote.deleteMany(),
      this.uEStarCriterion.deleteMany(),
      this.uEInfo.deleteMany(),
      this.uEWorkTime.deleteMany(),
      this.userUESubscription.deleteMany(),
      this.uTTBranchOption.deleteMany(),
      this.uTTBranch.deleteMany(),
      this.translation.deleteMany(),
      this.uECredit.deleteMany(),
      this.uECreditCategory.deleteMany(),
      this.uECommentReply.deleteMany(),
      this.uEComment.deleteMany(),
      this.uE.deleteMany(),
      this.semester.deleteMany(),
      this.userInfos.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}

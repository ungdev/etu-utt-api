import { ERROR_CODE } from '../src/exceptions';
import { UEComment } from 'src/ue/interfaces/comment.interface';
import { UECommentReply } from 'src/ue/interfaces/comment-reply.interface';
import { UEOverView } from 'src/ue/interfaces/ue-overview.interface';
import { UEDetail } from 'src/ue/interfaces/ue-detail.interface';
import { Criterion } from 'src/ue/interfaces/criterion.interface';
import { UERating } from 'src/ue/interfaces/rate.interface';

type DeepWritable<T> = { -readonly [key in keyof T]: DeepWritable<T[key]> };
export type JsonLikeVariant<T> = {
  [K in keyof T]: T[K] extends string | Date | DeepWritable<Date> ? string | RegExp : JsonLikeVariant<T[K]>;
};

declare module './declarations' {
  interface Spec {
    expectAppError(errorCode: ERROR_CODE, customMessage?: string): this;
    expectUE(ue: JsonLikeVariant<UEDetail>): this;
    expectUEs(page: JsonLikeVariant<Pagination<UEOverView>>): this;
    expectUEComment(comment: JsonLikeVariant<UEComment>, created = false): this;
    expectUECommentUpvote(upvote: JsonLikeVariant<{ upvoted: boolean }>): this;
    expectUEComments(commentPage: JsonLikeVariant<Pagination<UEComment>>): this;
    expectUECommentReply(reply: JsonLikeVariant<UECommentReply>, created = false): this;
    expectUECriteria(criterion: JsonLikeVariant<Criterion[]>): this;
    expectUERate(rate: JsonLikeVariant<UERating>): this;
    expectUERates(rate: JsonLikeVariant<UERating[]>): this;
  }
}

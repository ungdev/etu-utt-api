import { ERROR_CODE, ErrorData, ExtrasTypeBuilder } from '../src/exceptions';
import { UEComment } from 'src/ue/interfaces/comment.interface';
import { UECommentReply } from 'src/ue/interfaces/comment-reply.interface';
import { UEOverView } from 'src/ue/interfaces/ue-overview.interface';
import { UEDetail } from 'src/ue/interfaces/ue-detail.interface';
import { Criterion } from 'src/ue/interfaces/criterion.interface';
import { UERating } from 'src/ue/interfaces/rate.interface';
import { FakeUE } from './utils/fakedb';
import { AppProvider } from './utils/test_utils';

type JsonLikeVariant<T> = {
  [K in keyof T]: T[K] extends string | Date | DeepWritable<Date> ? string | RegExp : JsonLikeVariant<T[K]>;
};

/**
 * Overwrites the declarations in pactum/src/models/Spec
 * This is possible because the Spec class is re-exported in ./declarations.ts
 *
 * This way, the Spec class can be extended with custom methods (actually added in ./declarations.ts)
 */
declare module './declarations' {
  interface Spec {
    /**
     * expects an `AppError`, with the proper {@link ERROR_CODE} and the matching message
     * (this message may have an argument, provided in {@link customMessage})
     */
    expectAppError<ErrorCode extends ERROR_CODE>(
      errorCode: ErrorCode,
      ...customMessage: ExtrasTypeBuilder<(typeof ErrorData)[ErrorCode]['message']>
    ): this;
    /** expects to return the given {@link UEDetail} */
    expectUE(ue: FakeUE): this;
    /** expects to return the given {@link page | page of UEOverView} */
    expectUEs(app: AppProvider, ues: FakeUE[], count: number): this;
    /**
     * expects to return the given {@link comment}. The HTTP Status code may be 200 or 204,
     * depending on the {@link created} property.
     */
    expectUEComment(
      comment: JsonLikeVariant<RecursivelyPartiallyPartial<UEComment, 'author', 'answers.author'>>,
      created = false,
    ): this;
    /** expects to return the given {@link commentPage | page of comments} */
    expectUEComments(commentPage: JsonLikeVariant<Pagination<UEComment>>): this;
    /**
     * expects to return the given {@link reply}
     * The HTTP Status code may be 200 or 204, depending on the {@link created} property.
     */
    expectUECommentReply(reply: JsonLikeVariant<UECommentReply>, created = false): this;
    /** expects to return the given {@link criterion} list */
    expectUECriteria(criterion: JsonLikeVariant<Criterion[]>): this;
    /** expects to return the given {@link rate} */
    expectUERate(rate: JsonLikeVariant<UERating>): this;
    /** expects to return the given {@link rate} list */
    expectUERates(rate: JsonLikeVariant<UERating[]>): this;
  }
}

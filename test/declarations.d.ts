import { ERROR_CODE, ErrorData, ExtrasTypeBuilder } from '../src/exceptions';
import { UEComment } from 'src/ue/interfaces/comment.interface';
import { UECommentReply } from 'src/ue/comments/interfaces/comment-reply.interface';
import { UERating } from 'src/ue/interfaces/rate.interface';
import { FakeUEAnnalType } from './utils/fakedb';
import { UEAnnalFile } from 'src/ue/annals/interfaces/annal.interface';
import { Criterion } from 'src/ue/interfaces/criterion.interface';
import { UERating } from 'src/ue/interfaces/rate.interface';
import { FakeUE, FakeUser, FakeHomepageWidget, FakeAsso } from './utils/fakedb';
import { AppProvider } from './utils/test_utils';
import { Language } from '@prisma/client';

type JsonLikeVariant<T> = Partial<{
  [K in keyof T]: T[K] extends string | Date
    ? string | RegExp
    : T[K] extends (infer R)[]
    ? JsonLikeVariant<R>[]
    : JsonLikeVariant<T[K]>;
}>;

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

    /** expects to return the given {@link page | page of UserOverView} */
    expectUsers(app: AppProvider, users: FakeUser[], count: number): this;
    /** expects to return the given {@link UEDetail} */
    expectUE(ue: FakeUE, rates?: Array<{ criterionId: string; value: number }>): this;
    /** expects to return the given {@link UEOverView} */
    expectUes(ues: FakeUE[]): this;
    /** expects to return the given {@link page | page of UEOverView} */
    expectUEsWithPagination(app: AppProvider, ues: FakeUE[], count: number): this;
    /**
     * expects to return the given {@link comment}. The HTTP Status code may be 200 or 204,
     * depending on the {@link created} property.
     */
    expectUEComment(
      comment: JsonLikeVariant<RecursivelySetPartial<UEComment, 'author', 'answers.author'>>,
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
    expectUEAnnalMetadata(
      metadata: JsonLikeVariant<{
        types: FakeUEAnnalType[];
        semesters: string[];
      }>,
    ): this;
    expectUEAnnal(annals: JsonLikeVariant<UEAnnalFile>, created = false): this;
    expectUEAnnals(annals: JsonLikeVariant<UEAnnalFile>[]): this;
    /** expects to return the given {@link FakeHomepageWidget}s */
    expectHomepageWidgets(widgets: JsonLikeVariant<FakeHomepageWidget[]>): this;
    /** expects to return the given {@link AssosOverView} */
    expectAssos(app: AppProvider, assos: FakeAsso[], count: number): this;
    /** expects to return the given {@link asso} */
    expectAsso(asso: FakeAsso): this;
    expectCreditCategories(categories: JsonLikeVariant<FakeUECreditCategory[]>): this;
    withLanguage(language: Language): this;
    language: Language;
  }
}

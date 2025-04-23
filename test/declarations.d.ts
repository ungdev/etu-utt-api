import { ERROR_CODE, ErrorData, ExtrasTypeBuilder } from '../src/exceptions';
import { UeComment } from 'src/ue/comments/interfaces/comment.interface';
import { UeCommentReply } from 'src/ue/comments/interfaces/comment-reply.interface';
import { UeRating } from 'src/ue/interfaces/rate.interface';
import { FakeApiApplication, FakeUeAnnalType, FakeUeof } from './utils/fakedb';
import { UeAnnalFile } from 'src/ue/annals/interfaces/annal.interface';
import { Criterion } from 'src/ue/interfaces/criterion.interface';
import { UeRating } from 'src/ue/interfaces/rate.interface';
import { FakeUe, FakeUser, FakeHomepageWidget, FakeAsso } from './utils/fakedb';
import { AppProvider } from './utils/test_utils';
import { Language } from '@prisma/client';

type JsonLikeVariant<T> = Partial<{
  [K in keyof T]: T[K] extends string | Date
    ? string | RegExp
    : T[K] extends (infer R)[]
    ? JsonLikeVariant<R>[]
    : JsonLikeVariant<T[K]>;
}>;
type FakeUeWithOfs = FakeUe & { ueofs: FakeUeof[] };

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
    /** expects to return the given {@link UeDetail} */
    expectUe(ue: FakeUeWithOfs, rates?: Array<{ criterionId: string; value: number }>, rateCount?: number): this;
    /** expects to return the given {@link UeOverView} */
    expectUes(ues: FakeUeWithOfs[]): this;
    /** expects to return the given {@link page | page of UeOverView} */
    expectUesWithPagination(app: AppProvider, ues: FakeUeWithOfs[], count: number): this;
    /**
     * expects to return the given {@link comment}. The HTTP Status code may be 200 or 204,
     * depending on the {@link created} property.
     */
    expectUeComment(
      comment: JsonLikeVariant<RecursivelySetPartial<UeComment, 'author' | 'answers.author'>> & { ueof: FakeUeof },
      created = false,
    ): this;
    /** expects to return the given {@link commentPage | page of comments} */
    expectUeComments(commentPage: Pagination<UeComment & { ue: FakeUe }>): this;
    /**
     * expects to return the given {@link reply}
     * The HTTP Status code may be 200 or 204, depending on the {@link created} property.
     */
    expectUeCommentReply(reply: JsonLikeVariant<UeCommentReply>, created = false): this;
    /** expects to return the given {@link criterion} list */
    expectUeCriteria(criterion: JsonLikeVariant<Criterion[]>): this;
    /** expects to return the given {@link rate} */
    expectUeRate(rate: JsonLikeVariant<UeRating>): this;
    /** expects to return the given {@link rate} list */
    expectUeRates(rate: JsonLikeVariant<{ [criterion: string]: UeRating[] }>): this;
    expectUeAnnalMetadata(
      metadata: JsonLikeVariant<{
        types: FakeUeAnnalType[];
        semesters: string[];
      }>,
    ): this;
    expectUeAnnal(annals: JsonLikeVariant<UeAnnalFile>, created = false): this;
    expectUeAnnals(annals: JsonLikeVariant<UeAnnalFile>[]): this;
    /** expects to return the given {@link FakeHomepageWidget}s */
    expectHomepageWidgets(widgets: JsonLikeVariant<FakeHomepageWidget[]>): this;
    /** expects to return the given {@link AssosOverView} */
    expectAssos(app: AppProvider, assos: FakeAsso[], count: number): this;
    /** expects to return the given {@link asso} */
    expectAsso(asso: FakeAsso): this;
    expectCreditCategories(categories: JsonLikeVariant<FakeUeCreditCategory[]>): this;
    expectApplications(applications: FakeApiApplication[]): this;
    expectApplication(application: FakeApiApplication): this;

    withLanguage(language: Language): this;
    language: Language;
    withApplication(application: string): this;
    application: string;
  }
}

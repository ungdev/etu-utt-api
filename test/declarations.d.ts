import { ERROR_CODE, ErrorData, ExtrasTypeBuilder } from '../src/exceptions';
import { UeComment } from 'src/ue/comments/interfaces/comment.interface';
import { UeCommentReply } from 'src/ue/comments/interfaces/comment-reply.interface';
import { UeRating } from 'src/ue/interfaces/rate.interface';
import {
  FakeApiApplication,
  FakeAssoWeekly,
  FakeAssoMembership,
  FakeAssoMembershipPermission,
  FakeAssoMembershipRole,
  FakeImageMedia,
  FakeUeAnnalType,
  FakeUeof,
  FakeUeCreditCategory,
} from './utils/fakedb';
import { UeAnnalFile } from 'src/ue/annals/interfaces/annal.interface';
import { Criterion } from 'src/ue/interfaces/criterion.interface';
import { FakeUe, FakeUser, FakeHomepageWidget, FakeAsso } from './utils/fakedb';
import { AppProvider } from './utils/test_utils';
import { Language } from '@prisma/client';
import { PermissionManager } from '../src/utils';

type JsonLikeVariant<T> = Partial<{
  [K in keyof T]: T[K] extends string | Date
    ? symbol | RegExp | T[K]
    : T[K] extends number
      ? symbol | number
      : T[K] extends (infer R)[]
        ? JsonLikeVariant<R>[]
        : JsonLikeVariant<T[K]>;
}>;
type FakeUeWithOfs = FakeUe & { ueofs: FakeUeof[] };

type FakeAssoMembers = {
  role: FakeRole;
  users: {
    user: FakeUser;
    permissions: FakeAssoMembershipPermission[];
  }[];
}[];

/**
 * Overwrites the declarations in pactum/src/models/Spec
 * This is possible because the Spec class is re-exported in ./declarations.ts
 *
 * This way, the Spec class can be extended with custom methods (actually added in ./declarations.ts)
 */
declare module './declarations' {
  interface Spec {
    /** Checks for HTTP 201 Status. If omitted, status check will be 200 */
    created(): this;
    /** Checks for HTTP 204 Status. If omitted, status check will be 200 */
    noContent(): this;

    /** Overrides original expectStatus method, used to be compatible with created() and noContent(). If no method was called, will check for HTTP 200 OK */
    expectStatus(): this;

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
    /** expects to return the given {@link comment} */
    expectUeComment(
      comment: JsonLikeVariant<RecursivelySetPartial<UeComment, 'author' | 'answers.author'>> & { ueof: FakeUeof },
    ): this;
    /** expects to return the given {@link commentPage | page of comments} */
    expectUeComments(commentPage: Pagination<UeComment & { ue: FakeUe }>): this;
    /** expects to return the given {@link reply} */
    expectUeCommentReply(reply: JsonLikeVariant<UeCommentReply>): this;
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
    expectUeAnnal(annals: JsonLikeVariant<UeAnnalFile>): this;
    expectUeAnnals(annals: JsonLikeVariant<UeAnnalFile>[]): this;
    /** expects to return the given {@link FakeHomepageWidget}s */
    expectHomepageWidgets(widgets: JsonLikeVariant<FakeHomepageWidget[]>): this;
    /** expects to return the given {@link AssosOverView} */
    expectAssos(app: AppProvider, assos: FakeAsso[], count: number): this;
    /** expects to return the given {@link asso} */
    expectAsso(asso: FakeAsso): this;
    expectAssoMembershipRole(role: JsonLikeVariant<FakeAssoMembershipRole>): this;
    expectAssoMembershipRoles(roles: JsonLikeVariant<FakeAssoMembers>): this;
    expectAssoMembershipRolesRaw(roles: JsonLikeVariant<FakeAssoMembershipRole>[]): this;
    expectAssoMembership(membership: JsonLikeVariant<FakeAssoMembership>): this;
    expectCreditCategories(categories: JsonLikeVariant<FakeUeCreditCategory[]>): this;
    expectApplications(applications: FakeApiApplication[]): this;
    expectApplication(application: FakeApiApplication): this;
    expectImageMedia(media: JsonLikeVariant<FakeImageMedia>): this;

    expectPermissions(permissions: PermissionManager): this;
    expectAssoWeekly(weekly: JsonLikeVariant<FakeAssoWeekly>, created = false): this;
    expectAssoWeeklies(app: AppProvider, weeklies: JsonLikeVariant<FakeAssoWeekly>[], count: number): this;

    withLanguage(language: Language): this;
    language: Language;
    withApplication(application: string): this;
    application: string;

    /** Does NOT check HTTP status */
    $expectRegexableJson<T>(obj: JsonLikeVariant<T>): this;
  }
}

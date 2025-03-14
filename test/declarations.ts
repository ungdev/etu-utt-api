import { HttpStatus } from '@nestjs/common';
import Spec from 'pactum/src/models/Spec';
import { FakeUeWithOfs, JsonLikeVariant } from './declarations.d';
import { ERROR_CODE, ErrorData, ExtrasTypeBuilder } from '../src/exceptions';
import { UeComment } from '../src/ue/comments/interfaces/comment.interface';
import { UeCommentReply } from '../src/ue/comments/interfaces/comment-reply.interface';
import { Criterion } from 'src/ue/interfaces/criterion.interface';
import { UeRating } from 'src/ue/interfaces/rate.interface';
import {
  FakeUeAnnalType,
  FakeUser,
  FakeHomepageWidget,
  FakeAsso,
  FakeUeCreditCategory,
  FakeApiApplication,
} from './utils/fakedb';
import { UeAnnalFile } from 'src/ue/annals/interfaces/annal.interface';
import { ConfigModule } from '../src/config/config.module';
import { AppProvider } from './utils/test_utils';
import { getTranslation, omit, pick } from '../src/utils';
import { isArray } from 'class-validator';
import { Language } from '@prisma/client';
import { DEFAULT_APPLICATION } from '../prisma/seed/utils';
import ApplicationResDto from '../src/auth/application/dto/res/application-res.dto';

/** Shortcut function for `this.expectStatus(200).expectJsonLike` */
function expect<T>(this: Spec, obj: JsonLikeVariant<T>) {
  return this.expectStatus(HttpStatus.OK).expectJsonMatchStrict(obj);
}
/** Shortcut function for `this.expectStatus(200|204).expectJsonLike` */
function expectOkOrCreate<T>(this: Spec, obj: JsonLikeVariant<T>, created = false) {
  return this.expectStatus(created ? HttpStatus.CREATED : HttpStatus.OK).expectJsonLike(obj);
}

export function deepDateToString<T>(obj: T): JsonLikeVariant<T> {
  if (obj instanceof Date) return obj.toISOString() as JsonLikeVariant<T>;
  if (isArray(obj)) return obj.map(deepDateToString) as JsonLikeVariant<T>;
  if (obj === null || typeof obj !== 'object') return obj as JsonLikeVariant<T>;
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, deepDateToString(value)]),
  ) as JsonLikeVariant<T>;
}

function ueOverviewExpectation(ue: FakeUeWithOfs, spec: Spec) {
  return {
    code: ue.code,
    name: getTranslation(ue.ueofs[0].name, spec.language),
    credits: ue.ueofs[0].credits.map((credit) => ({
      ...omit(credit, 'id', 'ueofCode', 'categoryId', 'branchOptions'),
      branchOptions: credit.branchOptions.map((branchOption) => ({
        ...pick(branchOption, 'code', 'name'),
        branch: pick(branchOption.branch, 'code', 'name'),
      })),
    })),
    info: {
      ...omit(ue.ueofs[0].info, 'id', 'program', 'objectives', 'language', 'minors'),
      languages: [ue.ueofs[0].info.language],
      minors: ue.ueofs[0].info.minors?.split(',') ?? [],
    },
    openSemester: ue.ueofs[0].openSemester.map((semester) => ({
      ...semester,
      start: semester.start.toISOString(),
      end: semester.end.toISOString(),
    })),
  };
}

const baseToss = Spec.prototype.toss;

Spec.prototype.language = 'fr';
Spec.prototype.withLanguage = function (language: Language) {
  this.language = language;
  return <Spec>this;
};
Spec.prototype.application = DEFAULT_APPLICATION;
Spec.prototype.withApplication = function (application: string) {
  this.application = application;
  return <Spec>this;
};
Spec.prototype.toss = function () {
  (<Spec>this).withHeaders('X-Language', (<Spec>this).language).withHeaders('X-Application', (<Spec>this).application);
  return baseToss.call(<Spec>this);
};
Spec.prototype.expectAppError = function <ErrorCode extends ERROR_CODE>(
  errorCode: ErrorCode,
  ...args: ExtrasTypeBuilder<(typeof ErrorData)[ErrorCode]['message']>
) {
  return (<Spec>this).expectStatus(ErrorData[errorCode].httpCode).expectJson({
    errorCode,
    error: (args as string[]).reduce((arg, extra) => arg.replaceAll('%', extra), ErrorData[errorCode].message),
  });
};
Spec.prototype.expectUe = function (
  ue: FakeUeWithOfs,
  rates: Array<{ criterionId: string; value: number }>,
  rateCount: number,
) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonMatchStrict(
    deepDateToString({
      code: ue.code,
      creationYear: 2000 + Number(ue.ueofs[0].code.match(/\d+$/)?.[0] ?? 23),
      updateYear: 2000 + Number(ue.ueofs[0].code.match(/\d+$/)?.[0] ?? 23),
      ueofs: ue.ueofs.map((ueof) => ({
        name: getTranslation(ueof.name, this.language),
        code: ueof.code,
        credits: ueof.credits.map((credit) => ({
          ...omit(credit, 'id', 'ueofCode', 'categoryId', 'branchOptions'),
          branchOptions: credit.branchOptions.map((branchOption) => ({
            ...pick(branchOption, 'code', 'name'),
            branch: pick(branchOption.branch, 'code', 'name'),
          })),
        })),
        info: {
          ...omit(ueof.info, 'id'),
          objectives: getTranslation(ueof.info.objectives, this.language),
          program: getTranslation(ueof.info.program, this.language),
          minors: ueof.info.minors?.split(',') ?? [],
        },
        openSemester: ueof.openSemester
          .mappedSort((semester) => semester.start.toISOString())
          .map((semester) => ({
            ...semester,
            start: semester.start.toISOString(),
            end: semester.end.toISOString(),
          })),
        workTime: omit(ueof.workTime, 'id', 'ueofCode'),
        ...(rates
          ? {
              starVotes: Object.fromEntries([
                ...rates.map((rate) => [rate.criterionId, rate.value]),
                ['voteCount', rateCount || 0],
              ]),
            }
          : {}),
      })),
    }),
  );
};
Spec.prototype.expectUsers = function (app: AppProvider, users: FakeUser[], count: number) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonMatchStrict(
    deepDateToString({
      items: users.map((user) => ({
        ...pick(user, 'id', 'firstName', 'lastName', 'login', 'studentId', 'permissions', 'userType'),
        infos: pick(user.infos, 'nickname', 'avatar', 'nationality', 'passions', 'website'),
        branchSubscriptions: user.branchSubscriptions.map((branch) => pick(branch, 'id')),
        mailsPhones: pick(user.mailsPhones, 'mailUTT'),
        socialNetwork: omit(user.socialNetwork, 'id', 'discord'),
        addresses: [],
      })),
      itemCount: count,
      itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
    }),
  );
};
Spec.prototype.expectUes = function (ues: FakeUeWithOfs[]) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonLike(ues.map((ue) => ueOverviewExpectation(ue, this)));
};
Spec.prototype.expectUesWithPagination = function (app: AppProvider, ues: FakeUeWithOfs[], count: number) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonLike({
    items: ues.map((ue) => ueOverviewExpectation(ue, this)),
    itemCount: count,
    itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
  });
};
Spec.prototype.expectUeComment = function expect(this: Spec, obj, created = false) {
  return this.expectStatus(created ? HttpStatus.CREATED : HttpStatus.OK).expectJsonLike({
    ...omit(obj as any, 'ueof'),
    ueof: {
      code: obj.ueof.code,
      info: {
        language: obj.ueof.info.language,
      },
    },
  });
};
Spec.prototype.expectUeComments = function expect(obj) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonMatchStrict({
    itemCount: obj.itemCount,
    itemsPerPage: obj.itemsPerPage,
    items: obj.items.map((comment) => ({
      ...pick(
        comment,
        'id',
        'author',
        'body',
        'isAnonymous',
        'lastValidatedBody',
        'semester',
        'status',
        'upvoted',
        'upvotes',
      ),
      ueof: {
        code: comment.ueof.code,
        info: {
          language: comment.ueof.info.language,
        },
      },
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      answers: comment.answers.map((answer) => ({
        ...pick(answer, 'author', 'body', 'id', 'status'),
        createdAt: answer.createdAt.toISOString(),
        updatedAt: answer.updatedAt.toISOString(),
      })),
    })),
  } satisfies JsonLikeVariant<Pagination<UeComment>>);
};
Spec.prototype.expectUeCommentReply = expectOkOrCreate<UeCommentReply>;
Spec.prototype.expectUeCriteria = expect<Criterion[]>;
Spec.prototype.expectUeRate = expect<UeRating>;
Spec.prototype.expectUeRates = expect<{ [criterion: string]: UeRating[] }>;
Spec.prototype.expectUeAnnalMetadata = expect<{
  types: FakeUeAnnalType[];
  semesters: string[];
}>;
Spec.prototype.expectUeAnnal = expectOkOrCreate<UeAnnalFile>;
Spec.prototype.expectUeAnnals = expect<UeAnnalFile[]>;
Spec.prototype.expectHomepageWidgets = function (widgets: Omit<FakeHomepageWidget, 'id' | 'userId'>[]) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonLike(
    widgets.map((widget) => ({
      x: widget.x,
      y: widget.y,
      width: widget.width,
      height: widget.height,
      widget: widget.widget,
    })),
  );
};
Spec.prototype.expectAssos = function (app: AppProvider, assos: FakeAsso[], count: number) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson({
    items: assos.map((asso) => ({
      ...pick(asso, 'id', 'name', 'logo'),
      shortDescription: getTranslation(asso.descriptionShortTranslation, (<Spec>this).language),
      president: {
        role: asso.presidentRole,
        user: asso.president,
      },
    })),
    itemCount: count,
    itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
  });
};
Spec.prototype.expectAsso = function (asso: FakeAsso) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson({
    ...pick(asso, 'id', 'login', 'name', 'mail', 'phoneNumber', 'website', 'logo'),
    description: getTranslation(asso.descriptionTranslation, (<Spec>this).language),
    president: {
      role: asso.presidentRole,
      user: asso.president,
    },
  });
};
Spec.prototype.expectCreditCategories = function (creditCategories: FakeUeCreditCategory[]) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson(creditCategories);
};
Spec.prototype.expectApplications = function (applications: FakeApiApplication[]) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson(
    [...applications]
      .mappedSort((application) => application.name)
      .map(
        (application) =>
          ({
            id: application.id,
            name: application.name,
            userId: application.userId,
            redirectUrl: application.redirectUrl,
          } satisfies ApplicationResDto),
      ),
  );
};
Spec.prototype.expectApplication = function (application: FakeApiApplication) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson({
    id: application.id,
    name: application.name,
    userId: application.userId,
    redirectUrl: application.redirectUrl,
  } satisfies ApplicationResDto);
};

export { Spec, JsonLikeVariant, FakeUeWithOfs };

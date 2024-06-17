import { HttpStatus } from '@nestjs/common';
import Spec from 'pactum/src/models/Spec';
import { JsonLikeVariant } from './declarations.d';
import { ERROR_CODE, ErrorData, ExtrasTypeBuilder } from '../src/exceptions';
import { UeComment } from '../src/ue/comments/interfaces/comment.interface';
import { UeCommentReply } from '../src/ue/comments/interfaces/comment-reply.interface';
import { Criterion } from 'src/ue/interfaces/criterion.interface';
import { UeRating } from 'src/ue/interfaces/rate.interface';
import { FakeUeAnnalType, FakeUser, FakeUe, FakeHomepageWidget, FakeAsso, FakeUeCreditCategory } from './utils/fakedb';
import { UeAnnalFile } from 'src/ue/annals/interfaces/annal.interface';
import { ConfigModule } from '../src/config/config.module';
import { AppProvider } from './utils/test_utils';
import { getTranslation, omit, pick } from '../src/utils';
import { isArray } from 'class-validator';
import { Language } from '@prisma/client';

/** Shortcut function for `this.expectStatus(200).expectJsonLike` */
function expect<T>(obj: JsonLikeVariant<T>) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonMatchStrict(obj);
}
/** Shortcut function for `this.expectStatus(200|204).expectJsonLike` */
function expectOkOrCreate<T>(obj: JsonLikeVariant<T>, created = false) {
  return (<Spec>this).expectStatus(created ? HttpStatus.CREATED : HttpStatus.OK).expectJsonLike(obj);
}

export function deepDateToString<T>(obj: T): JsonLikeVariant<T> {
  if (obj instanceof Date) return obj.toISOString() as JsonLikeVariant<T>;
  if (isArray(obj)) return obj.map(deepDateToString) as JsonLikeVariant<T>;
  if (obj === null || typeof obj !== 'object') return obj as JsonLikeVariant<T>;
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, deepDateToString(value)]),
  ) as JsonLikeVariant<T>;
}

function ueOverviewExpectation(ue: FakeUe, spec: Spec) {
  return {
    ...omit(ue, 'id', 'validationRate', 'createdAt', 'updatedAt', 'openSemesters', 'workTime'),
    name: getTranslation(ue.name, spec.language),
    info: {
      ...omit(ue.info, 'id', 'comment', 'program', 'objectives'),
      comment: getTranslation(ue.info.comment, spec.language),
      program: getTranslation(ue.info.program, spec.language),
      objectives: getTranslation(ue.info.objectives, spec.language),
    },
    credits: ue.credits.map((credit) => omit(credit, 'id', 'ueId', 'categoryId')),
    branchOption: ue.branchOption.map((branchOption) => ({
      ...pick(branchOption, 'code', 'name'),
      branch: pick(branchOption.branch, 'code', 'name'),
    })),
    openSemester: ue.openSemesters.map((semester) => ({
      ...semester,
      start: semester.start.toISOString(),
      end: semester.end.toISOString(),
    })),
  };
}

Spec.prototype.language = 'fr';
Spec.prototype.withLanguage = function (language: Language) {
  this.language = language;
  return <Spec>this;
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
Spec.prototype.expectUe = function (ue: FakeUe, rates: Array<{ criterionId: string; value: number }> = []) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonMatchStrict(
    deepDateToString({
      ...omit(ue, 'id', 'validationRate', 'createdAt', 'updatedAt', 'openSemesters'),
      name: getTranslation(ue.name, this.language),
      info: {
        ...omit(ue.info, 'id'),
        objectives: getTranslation(ue.info.objectives, this.language),
        comment: getTranslation(ue.info.comment, this.language),
        program: getTranslation(ue.info.program, this.language),
      },
      workTime: omit(ue.workTime, 'id', 'ueId'),
      credits: ue.credits.map((credit) => omit(credit, 'id', 'ueId', 'categoryId')),
      branchOption: ue.branchOption.map((branchOption) => ({
        ...pick(branchOption, 'code', 'name'),
        branch: pick(branchOption.branch, 'code', 'name'),
      })),
      openSemester: ue.openSemesters
        .mappedSort((semester) => semester.start.toISOString())
        .map((semester) => ({
          ...semester,
          start: semester.start.toISOString(),
          end: semester.end.toISOString(),
        })),
      starVotes: Object.fromEntries(rates.map((rate) => [rate.criterionId, rate.value])),
    }),
  );
};
Spec.prototype.expectUsers = function (app: AppProvider, users: FakeUser[], count: number) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonMatchStrict(
    deepDateToString({
      items: users.map((user) => ({
        ...pick(user, 'id', 'firstName', 'lastName', 'login', 'studentId', 'permissions', 'userType'),
        infos: omit(user.infos, 'id'),
        branchSubscriptions: user.branchSubscriptions.map((branch) => pick(branch, 'id')),
        mailsPhones: omit(user.mailsPhones, 'id'),
        socialNetwork: omit(user.socialNetwork, 'id'),
        addresses: user.addresses.map((address) => omit(address, 'id')),
        preference: omit(user.preference, 'id'),
      })),
      itemCount: count,
      itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
    }),
  );
};
Spec.prototype.expectUes = function (ues: FakeUe[]) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonLike(ues.map((ue) => ueOverviewExpectation(ue, this)));
};
Spec.prototype.expectUesWithPagination = function (app: AppProvider, ues: FakeUe[], count: number) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonLike({
    items: ues.map((ue) => ueOverviewExpectation(ue, this)),
    itemCount: count,
    itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
  });
};
Spec.prototype.expectUeComment = expectOkOrCreate<SetPartial<UeComment, 'author'>>;
Spec.prototype.expectUeComments = function expect(obj: Pagination<UeComment>) {
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
Spec.prototype.expectUeRates = expect<UeRating[]>;
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
      ...pick(asso, 'id', 'name', 'logo', 'president'),
      descriptionShortTranslation: getTranslation(asso.descriptionShortTranslation, (<Spec>this).language),
    })),
    itemCount: count,
    itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
  });
};
Spec.prototype.expectAsso = function (asso: FakeAsso) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson({
    ...pick(asso, 'id', 'login', 'name', 'mail', 'phoneNumber', 'website', 'logo', 'president'),
    descriptionTranslation: getTranslation(asso.descriptionTranslation, (<Spec>this).language),
  });
};
Spec.prototype.expectCreditCategories = function (creditCategories: FakeUeCreditCategory[]) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson(creditCategories);
};

export { Spec, JsonLikeVariant };

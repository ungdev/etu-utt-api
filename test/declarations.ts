import { HttpStatus } from '@nestjs/common';
import Spec from 'pactum/src/models/Spec';
import { FakeAssoMembers, FakeUeWithOfs, JsonLikeVariant } from './declarations.d';
import { ERROR_CODE, ErrorData, ExtrasTypeBuilder } from '../src/exceptions';
import { UeComment, UeCommentReport } from '../src/ue/comments/interfaces/comment.interface';
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
  FakeAssoMembershipRole,
  FakeAssoMembership,
} from './utils/fakedb';
import { UeAnnalFile } from 'src/ue/annals/interfaces/annal.interface';
import { ConfigModule } from '../src/config/config.module';
import { AppProvider, JsonLike } from './utils/test_utils';
import { getTranslation, omit, PermissionManager, pick } from '../src/utils';
import { regex, string, uuid } from 'pactum-matchers';
import { Language } from '@prisma/client';
import { DEFAULT_APPLICATION } from '../prisma/seed/utils';
import ApplicationResDto from '../src/auth/application/dto/res/application-res.dto';
import PermissionsResDto from '../src/auth/permissions/dto/res/permissions.dto';

function expect<T>(this: Spec, obj: JsonLikeVariant<T>) {
  return this.expectStatus(HttpStatus.OK).$expectRegexableJson(obj);
}

function expectOkOrCreate<T>(this: Spec, obj: JsonLikeVariant<T>, created = false) {
  return this.expectStatus(created ? HttpStatus.CREATED : HttpStatus.OK).$expectRegexableJson(obj);
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
      start: semester.start,
      end: semester.end,
    })),
  };
}

const baseToss = Spec.prototype.toss;

Spec.prototype.language = 'fr';
Spec.prototype.withLanguage = function (language: Language) {
  this.language = language;
  return <Spec>this;
};
Spec.prototype.application = DEFAULT_APPLICATION.id;
Spec.prototype.withApplication = function (application: string) {
  this.application = application;
  return <Spec>this;
};
// Spec.prototype.toss is the function called to execute the request.
// Here, we modify it to include the special headers just before sending the request.
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
    error: (args as string[]).reduce((arg, extra) => arg.replace('%', extra), ErrorData[errorCode].message),
  });
};
Spec.prototype.expectUe = function (
  ue: FakeUeWithOfs,
  rates: Array<{ criterionId: string; value: number }>,
  rateCount: number,
) {
  return (<Spec>this).expectStatus(HttpStatus.OK).$expectRegexableJson({
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
        .mappedSort((semester) => semester.start)
        .map((semester) => ({
          ...semester,
          start: semester.start,
          end: semester.end,
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
  });
};
Spec.prototype.expectUsers = function (app: AppProvider, users: FakeUser[], count: number) {
  return (<Spec>this).expectStatus(HttpStatus.OK).$expectRegexableJson({
    items: users.map((user) => ({
      ...pick(user, 'id', 'firstName', 'lastName', 'login', 'studentId', 'userType'),
      infos: pick(user.infos, 'nickname', 'avatar', 'nationality', 'passions', 'website'),
      branchSubscriptions: user.branchSubscriptions.map((branch) => pick(branch, 'id')),
      mailsPhones: pick(user.mailsPhones, 'mailUTT'),
      socialNetwork: omit(user.socialNetwork, 'id', 'discord'),
      addresses: [],
    })),
    itemCount: count,
    itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
  });
};
Spec.prototype.expectUes = function (ues: FakeUeWithOfs[]) {
  return (<Spec>this)
    .expectStatus(HttpStatus.OK)
    .$expectRegexableJson(ues.map((ue) => ueOverviewExpectation(ue, this)));
};
Spec.prototype.expectUesWithPagination = function (app: AppProvider, ues: FakeUeWithOfs[], count: number) {
  return (<Spec>this).expectStatus(HttpStatus.OK).$expectRegexableJson({
    items: ues.map((ue) => ueOverviewExpectation(ue, this)),
    itemCount: count,
    itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
  });
};
Spec.prototype.expectUeComment = function (this: Spec, obj, created = false) {
  return this.expectStatus(created ? HttpStatus.CREATED : HttpStatus.OK).$expectRegexableJson({
    ...omit(obj as any, 'ueof'),
    ueof: {
      code: obj.ueof.code,
      info: {
        language: obj.ueof.info.language,
      },
    },
  } satisfies JsonLikeVariant<UeComment>);
};
Spec.prototype.expectUeComments = function (this: Spec, obj) {
  return this.expectStatus(HttpStatus.OK).$expectRegexableJson({
    itemCount: obj.itemCount,
    itemsPerPage: obj.itemsPerPage,
    items: obj.items.map((comment) => ({
      ...omit(comment, 'ueof','ue'),
      ueof: {
        code: comment.ueof.code,
        info: {
          language: comment.ueof.info.language,
        },
      },
    })),
  } satisfies JsonLikeVariant<Pagination<UeComment>>);
};
Spec.prototype.expectUeCommentReply = expectOkOrCreate<UeCommentReply>;
Spec.prototype.expectUeCommentReport = expectOkOrCreate<UeCommentReport>;
Spec.prototype.expectUeCriteria = expect<Criterion[]>;
Spec.prototype.expectUeRate = expect<UeRating>;
Spec.prototype.expectUeRates = expect<{ [criterion: string]: UeRating[] }>;
Spec.prototype.expectUeAnnalMetadata = expect<{
  types: FakeUeAnnalType[];
  semesters: string[];
}>;
Spec.prototype.expectUeAnnal = expectOkOrCreate<UeAnnalFile>;
Spec.prototype.expectUeAnnals = expect<UeAnnalFile[]>;
Spec.prototype.expectHomepageWidgets = function (this: Spec, widgets: Omit<FakeHomepageWidget, 'id' | 'userId'>[]) {
  return this.expectStatus(HttpStatus.OK).$expectRegexableJson(
    widgets.map((widget) => ({
      x: widget.x,
      y: widget.y,
      width: widget.width,
      height: widget.height,
      widget: widget.widget,
    })),
  );
};
Spec.prototype.expectAssos = function (this: Spec, app: AppProvider, assos: FakeAsso[], count: number) {
  return this.expectStatus(HttpStatus.OK).expectJson({
    items: assos.map((asso) => ({
      ...pick(asso, 'id', 'name', 'logo'),
      shortDescription: getTranslation(asso.descriptionShortTranslation, (<Spec>this).language),
      president: {
        role: !!asso.presidentRole ? pick(asso.presidentRole, 'id', 'name') : null,
        user: !!asso.president ? pick(asso.president, 'id', 'firstName', 'lastName') : null,
      },
    })),
    itemCount: count,
    itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
  });
};
Spec.prototype.expectAsso = function (asso: FakeAsso) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson({
    ...pick(asso, 'id', 'name', 'mail', 'phoneNumber', 'website', 'logo'),
    description: getTranslation(asso.descriptionTranslation, (<Spec>this).language),
    president: {
      role: !!asso.presidentRole ? pick(asso.presidentRole, 'id', 'name') : null,
      user: !!asso.president ? pick(asso.president, 'id', 'firstName', 'lastName') : null,
    },
  });
};
Spec.prototype.expectAssoMembership = function (member: JsonLikeVariant<FakeAssoMembership>) {
  return (<Spec>this)
    .expectStatus(HttpStatus.OK)
    .$expectRegexableJson(pick(member, 'id', 'roleId', 'userId', 'startAt', 'endAt'));
};
Spec.prototype.expectAssoMembershipCreated = function (member: JsonLikeVariant<FakeAssoMembership>) {
  return (<Spec>this)
    .expectStatus(HttpStatus.CREATED)
    .$expectRegexableJson(pick(member, 'id', 'roleId', 'userId', 'startAt', 'endAt'));
};
Spec.prototype.expectAssoMembershipRole = function (role: FakeAssoMembershipRole) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson(pick(role, 'id', 'name', 'position', 'isPresident'));
};
Spec.prototype.expectAssoMembershipRoleCreated = function (role: FakeAssoMembershipRole) {
  return (<Spec>this)
    .expectStatus(HttpStatus.CREATED)
    .$expectRegexableJson(pick(role, 'id', 'name', 'position', 'isPresident'));
};
Spec.prototype.expectAssoMembershipRolesRaw = function (roles: FakeAssoMembershipRole[]) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson({
    roles: roles.map((role) => pick(role, 'id', 'name', 'position', 'isPresident')),
  });
};
Spec.prototype.expectAssoMembershipRoles = function (members: JsonLikeVariant<FakeAssoMembers>) {
  return (<Spec>this).expectStatus(HttpStatus.OK).$expectRegexableJson({
    roles: members.map((roleEntry) => ({
      ...pick(roleEntry.role, 'id', 'name', 'position', 'isPresident'),
      members: roleEntry.users.map((userEntry) => ({
        ...pick(userEntry.user, 'firstName', 'lastName'),
        id: JsonLike.UUID,
        userId: userEntry.user.id,
        startAt: JsonLike.DATE,
        endAt: JsonLike.DATE,
        permissions: userEntry.permissions.map((p) => p.id),
      })),
    })),
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
            ...pick(application as Required<FakeApiApplication>, 'id', 'name', 'redirectUrl'),
            owner: pick(application.owner, 'id', 'firstName', 'lastName'),
          }) satisfies ApplicationResDto,
      ),
  );
};
Spec.prototype.expectApplication = function (application: FakeApiApplication) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson({
    ...pick(application as Required<FakeApiApplication>, 'id', 'name', 'redirectUrl'),
    owner: pick(application.owner, 'id', 'firstName', 'lastName'),
  } satisfies ApplicationResDto);
};
Spec.prototype.expectPermissions = function (permissions: PermissionManager) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson({
    hardPermissions: permissions.hardPermissions.sort(),
    softPermissions: Object.entries(permissions.softPermissions)
      .map(([permission, users]) => ({
        permission,
        users,
      }))
      .mappedSort((permission) => permission.permission),
  } satisfies PermissionsResDto);
};

export { Spec, JsonLikeVariant, FakeUeWithOfs };

// Internal methods below

Spec.prototype.$expectRegexableJson = function <T>(this: Spec, obj: JsonLikeVariant<T>) {
  function wrap<T>(obj: JsonLikeVariant<T>) {
    if (obj instanceof RegExp) return regex(obj.source);
    if (obj instanceof Date) return obj.toISOString();
    if (typeof obj === 'symbol') {
      switch (<symbol>obj) {
        case JsonLike.STRING:
          return string();
        case JsonLike.UUID:
          return uuid();
      }
    }
    if (Array.isArray(obj)) return obj.map(wrap);
    if (obj === null || typeof obj !== 'object') return obj;
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, wrap(value as JsonLikeVariant<T[typeof key]>)]),
    );
  }
  return this.expectJsonSchema(generateSchema(obj)).expectJsonMatch(wrap(obj));
};

// Schema should match rules defined here : https://ajv.js.org/json-schema.html
function generateSchema<T>(obj: JsonLikeVariant<T>): object {
  if (obj === null) return { type: 'null' };
  if (obj instanceof RegExp) return { type: 'string', pattern: obj.source };
  if (Array.isArray(obj))
    return {
      type: 'array',
      items: obj.map(generateSchema),
      additionalItems: false,
    };
  if (obj instanceof Date) return { type: 'string', format: 'date-time' };
  if (typeof obj === 'object')
    return {
      type: 'object',
      required: Object.keys(obj).filter((key) => obj[key] !== undefined),
      additionalProperties: false,
      properties: Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, generateSchema(value as JsonLikeVariant<T[typeof key]>)]),
      ),
    };
  if (obj === JsonLike.STRING || obj === JsonLike.UUID) return { type: 'string' };
  switch (typeof obj) {
    case 'string':
      return { type: 'string' };
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
  }
}

import { HttpStatus } from '@nestjs/common';
import Spec, { prototype as SpecProto } from 'pactum/src/models/Spec';
import { JsonLikeVariant } from './declarations.d';
import { ERROR_CODE, ErrorData, ExtrasTypeBuilder } from '../src/exceptions';
import { UEComment } from '../src/ue/interfaces/comment.interface';
import { UECommentReply } from '../src/ue/interfaces/comment-reply.interface';
import { Criterion } from 'src/ue/interfaces/criterion.interface';
import { UERating } from 'src/ue/interfaces/rate.interface';
import { FakeUE, FakeUser, FakeHomepageWidget } from './utils/fakedb';
import { ConfigModule } from '../src/config/config.module';
import { AppProvider } from './utils/test_utils';
import { omit, pick, sortArray } from '../src/utils';

/** Shortcut function for `this.expectStatus(200).expectJsonLike` */
function expect<T>(obj: JsonLikeVariant<T>) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonMatchStrict(obj);
}
/** Shortcut function for `this.expectStatus(200|204).expectJsonLike` */
function expectOkOrCreate<T>(obj: JsonLikeVariant<T>, created = false) {
  return (<Spec>this).expectStatus(created ? HttpStatus.CREATED : HttpStatus.OK).expectJsonLike(obj);
}

SpecProto.expectAppError = function <ErrorCode extends ERROR_CODE>(
  errorCode: ErrorCode,
  ...args: ExtrasTypeBuilder<(typeof ErrorData)[ErrorCode]['message']>
) {
  return (<Spec>this).expectStatus(ErrorData[errorCode].httpCode).expectJson({
    errorCode,
    error: (args as string[]).reduce((arg, extra) => arg.replaceAll('%', extra), ErrorData[errorCode].message),
  });
};
SpecProto.expectUE = function (ue: FakeUE, rates: Array<{ criterionId: string; value: number }> = []) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson({
    ...omit(ue, 'id', 'validationRate', 'createdAt', 'updatedAt', 'openSemesters'),
    info: omit(ue.info, 'id', 'ueId'),
    workTime: omit(ue.workTime, 'id', 'ueId'),
    credits: ue.credits.map((credit) => omit(credit, 'id', 'ueId', 'categoryId')),
    branchOption: ue.branchOption.map((branchOption) => ({
      ...pick(branchOption, 'code', 'name'),
      branch: pick(branchOption.branch, 'code', 'name'),
    })),
    openSemester: sortArray(ue.openSemesters, (semester) => semester.start.toISOString()).map((semester) => ({
      ...semester,
      start: semester.start.toISOString(),
      end: semester.end.toISOString(),
    })),
    starVotes: Object.fromEntries(rates.map((rate) => [rate.criterionId, rate.value])),
  });
};
SpecProto.expectUsers = function (app: AppProvider, users: FakeUser[], count: number) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonLike({
    items: users.map((user) => ({
      ...omit(user, 'id'),
    })),
    itemCount: count,
    itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
  });
};
SpecProto.expectUEs = function (app: AppProvider, ues: FakeUE[], count: number) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonLike({
    items: ues.map((ue) => ({
      ...omit(ue, 'id', 'validationRate', 'createdAt', 'updatedAt', 'openSemesters', 'workTime'),
      info: omit(ue.info, 'id', 'ueId'),
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
    })),
    itemCount: count,
    itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
  });
};
SpecProto.expectUEComment = expectOkOrCreate<SetPartial<UEComment, 'author'>>;
SpecProto.expectUEComments = expect<Pagination<UEComment>>;
SpecProto.expectUECommentReply = expectOkOrCreate<UECommentReply>;
SpecProto.expectUECriteria = expect<Criterion[]>;
SpecProto.expectUERate = expect<UERating>;
SpecProto.expectUERates = expect<UERating[]>;
SpecProto.expectHomepageWidgets = function (widgets: Omit<FakeHomepageWidget, 'id' | 'userId'>[]) {
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

export { Spec, JsonLikeVariant };

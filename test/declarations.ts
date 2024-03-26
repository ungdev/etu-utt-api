import { HttpStatus } from '@nestjs/common';
import Spec from 'pactum/src/models/Spec';
import { JsonLikeVariant } from './declarations.d';
import { ERROR_CODE, ErrorData, ExtrasTypeBuilder } from '../src/exceptions';
import { UEComment } from '../src/ue/comments/interfaces/comment.interface';
import { UECommentReply } from '../src/ue/comments/interfaces/comment-reply.interface';
import { Criterion } from 'src/ue/interfaces/criterion.interface';
import { UERating } from 'src/ue/interfaces/rate.interface';
import { FakeUEAnnalType } from './utils/fakedb';
import { UEAnnalFile } from 'src/ue/annals/interfaces/annal.interface';
import { FakeUE } from './utils/fakedb';
import { ConfigModule } from '../src/config/config.module';
import { AppProvider } from './utils/test_utils';
import { omit, pick } from '../src/utils';

/** Shortcut function for `this.expectStatus(200).expectJsonLike` */
function expect<T>(obj: JsonLikeVariant<T>) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonMatchStrict(obj);
}
/** Shortcut function for `this.expectStatus(200|204).expectJsonLike` */
function expectOkOrCreate<T>(obj: JsonLikeVariant<T>, created = false) {
  return (<Spec>this).expectStatus(created ? HttpStatus.CREATED : HttpStatus.OK).expectJsonLike(obj);
}

Spec.prototype.expectAppError = function <ErrorCode extends ERROR_CODE>(
  errorCode: ErrorCode,
  ...args: ExtrasTypeBuilder<(typeof ErrorData)[ErrorCode]['message']>
) {
  return (<Spec>this).expectStatus(ErrorData[errorCode].httpCode).expectJson({
    errorCode,
    error: (args as string[]).reduce((arg, extra) => arg.replaceAll('%', extra), ErrorData[errorCode].message),
  });
};
Spec.prototype.expectUE = function (ue: FakeUE, rates: Array<{ criterionId: string; value: number }> = []) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJson({
    ...omit(ue, 'id', 'validationRate', 'createdAt', 'updatedAt', 'openSemesters'),
    info: omit(ue.info, 'id', 'ueId'),
    workTime: omit(ue.workTime, 'id', 'ueId'),
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
    starVotes: Object.fromEntries(rates.map((rate) => [rate.criterionId, rate.value])),
  });
};
Spec.prototype.expectUEs = function (app: AppProvider, ues: FakeUE[], count: number) {
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
Spec.prototype.expectUEComment = expectOkOrCreate<SetPartial<UEComment, 'author'>>;
Spec.prototype.expectUEComments = expect<Pagination<UEComment>>;
Spec.prototype.expectUECommentReply = expectOkOrCreate<UECommentReply>;
Spec.prototype.expectUECriteria = expect<Criterion[]>;
Spec.prototype.expectUERate = expect<UERating>;
Spec.prototype.expectUERates = expect<UERating[]>;
Spec.prototype.expectUEAnnalMetadata = expect<{
  types: FakeUEAnnalType[];
  semesters: string[];
}>;
Spec.prototype.expectUEAnnal = expectOkOrCreate<UEAnnalFile>;
Spec.prototype.expectUEAnnals = expect<UEAnnalFile[]>;

export { Spec, JsonLikeVariant };

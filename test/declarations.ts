import { HttpStatus } from '@nestjs/common';
import Spec, { prototype as SpecProto } from 'pactum/src/models/Spec';
import { JsonLikeVariant } from './declarations.d';
import { ERROR_CODE, ErrorData, ExtrasTypeBuilder } from '../src/exceptions';
import { UEComment } from '../src/ue/interfaces/comment.interface';
import { UECommentReply } from '../src/ue/interfaces/comment-reply.interface';
import { UEOverView } from 'src/ue/interfaces/ue-overview.interface';
import { UEDetail } from 'src/ue/interfaces/ue-detail.interface';
import { Criterion } from 'src/ue/interfaces/criterion.interface';
import { UERating } from 'src/ue/interfaces/rate.interface';

/** Shortcut function for `this.expectStatus(200).expectJsonLike` */
function expect<T>(obj: JsonLikeVariant<T>) {
  return (<Spec>this).expectStatus(HttpStatus.OK).expectJsonLike(obj);
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
SpecProto.expectUE = expect<UEDetail>;
SpecProto.expectUEs = expect<Pagination<UEOverView>>;
SpecProto.expectUEComment = expectOkOrCreate<UEComment>;
SpecProto.expectUEComments = expect<Pagination<UEComment>>;
SpecProto.expectUECommentReply = expectOkOrCreate<UECommentReply>;
SpecProto.expectUECriteria = expect<Criterion[]>;
SpecProto.expectUERate = expect<UERating>;
SpecProto.expectUERates = expect<UERating[]>;

export { Spec };

import { PipeTransform } from '@nestjs/common';
import { AppException, ERROR_CODE } from './exceptions';

/**
 * A validating pipe for regex.
 * @example
 * .@Get('/:phoneNumber')
 * public foo(@Param('fooUuid', new RegexPipe(/[0-9]{10}/)) fooUuid: string) {
 *   return { message: "This is a test controller" };
 * }
 */
export class RegexPipe implements PipeTransform<string, string> {
  constructor(private regex: RegExp) {}

  transform(value: string) {
    if (!value.match(this.regex)) {
      throw new AppException(ERROR_CODE.PARAM_DOES_NOT_MATCH_REGEX, this.regex.toString());
    }
    return value;
  }
}

/**
 * Common regex.
 */
export const regex = {
  uuid: /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/,
  timetableOccurrenceId: /^\d+@[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/,
};

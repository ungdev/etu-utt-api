import {
  Param,
  ParseUUIDPipe,
  Type,
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  ValidationPipe,
} from '@nestjs/common';
import { AppException, ERROR_CODE } from './exceptions';
import { validationExceptionFactory } from './validation';

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

  transform(value: string, metadata: ArgumentMetadata) {
    if (!value.match(this.regex)) {
      throw new AppException(ERROR_CODE.PARAM_DOES_NOT_MATCH_REGEX, this.regex.toString(), metadata.data);
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

export const UUIDParam = (property: string, ...pipes: (Type<PipeTransform> | PipeTransform)[]) =>
  Param(
    property,
    new ParseUUIDPipe({
      exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, property),
    }),
    ...pipes,
  );

export interface ArrayDto<T> extends Array<T> {
  items: T[];
}

// Don't make it extend Array<T>, it would break the validation as a field called 0 would be needed.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class ArrayDto<T> {}

export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: validationExceptionFactory,
    });
  }
  public async transform(value: any, argumentMetadata?: ArgumentMetadata): Promise<any> {
    if (argumentMetadata.metatype && argumentMetadata.metatype.prototype instanceof ArrayDto) {
      const res = await super.transform(new argumentMetadata.metatype(value), argumentMetadata);
      // Now, res contains an ArrayDto with the right types inside.
      // We want to convert it what the interface tells it is.
      // First, we can take the items, we now have the most part of the type.
      const toArray = res.items;
      // We only need the items field, so we add it.
      toArray.items = res.items;
      // And return the result
      return toArray;
    }
    return super.transform(value, argumentMetadata);
  }
}

@Injectable()
export class PositiveNumberValidationPipe implements PipeTransform {
  async transform(value: string) {
    const asNumber = Number.parseInt(value);
    if (Number.isNaN(asNumber)) {
      throw new BadRequestException('value must be a positive number');
    }
    if (asNumber <= 0) {
      throw new BadRequestException('value must be a positive number');
    }
    return asNumber;
  }
}

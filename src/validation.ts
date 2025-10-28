import { Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { AppException, ERROR_CODE } from './exceptions';
import { ValidationError } from '@nestjs/common/interfaces/external/validation-error.interface';

/**
 * When a parameter error occurs, it is catched by the {@link getValidationPipe | ValidationPipe}.
 * It formats the error with an {@link ERROR_CODE} and a message.
 *
 * Custom errors priority:
 * When multiple errors are present, only the first one is displayed in the error message.
 * The order is given by the order of the properties in this object.
 */
const mappedErrors = {
  whitelistValidation: ERROR_CODE.PARAM_DOES_NOT_EXIST,
  isNotEmpty: ERROR_CODE.PARAM_MISSING,
  hasEither: ERROR_CODE.PARAM_MISSING_EITHER,
  isString: ERROR_CODE.PARAM_NOT_STRING,
  isAlphanumeric: ERROR_CODE.PARAM_NOT_ALPHANUMERIC,
  isNumber: ERROR_CODE.PARAM_NOT_NUMBER,
  isInt: ERROR_CODE.PARAM_NOT_INT,
  isEnum: ERROR_CODE.PARAM_NOT_ENUM,
  isDate: ERROR_CODE.PARAM_NOT_DATE,
  isUuid: ERROR_CODE.PARAM_NOT_UUID,
  isLength: ERROR_CODE.PARAM_INVALID_SIZE,
  maxLength: ERROR_CODE.PARAM_TOO_LONG,
  minLength: ERROR_CODE.PARAM_TOO_SHORT,
  arrayMinSize: ERROR_CODE.PARAM_SIZE_TOO_SMALL,
  arrayMaxSize: ERROR_CODE.PARAM_SIZE_TOO_BIG,
  arrayNotEmpty: ERROR_CODE.PARAM_IS_EMPTY,
  isPositive: ERROR_CODE.PARAM_NOT_POSITIVE,
  min: ERROR_CODE.PARAM_TOO_LOW,
  max: ERROR_CODE.PARAM_TOO_HIGH,
  isUrl: ERROR_CODE.PARAM_NOT_URL,
  isFutureDate: ERROR_CODE.PARAM_PAST_DATE,
} satisfies {
  [constraint: string]: ERROR_CODE;
};

export const validationExceptionFactory = (errors: ValidationError[]) => {
  // Map errors by constraint name
  const errorsByType: { [constraint: string]: string[] } = {};
  for (const error of errors) {
    if (error.children?.length) {
      return validationExceptionFactory(error.children);
    }
    for (const constraint of Object.keys(error.constraints)) {
      if (constraint in errorsByType) errorsByType[constraint].push(error.property);
      else errorsByType[constraint] = [error.property];
    }
  }
  // Loop on possible errors and throw the first one
  for (const [constraint, error] of Object.entries(mappedErrors)) {
    if (constraint in errorsByType) return new AppException(error, errorsByType[constraint].sort().join(', '));
  }
  console.error(errors); // TODO : send to sentry. soon™
  // If errors are not registered in the mappedErrors object, throw a generic error
  return new AppException(
    ERROR_CODE.PARAM_MALFORMED,
    errors
      .map((error) => error.property)
      .sort()
      .join(', '),
  );
};

@ValidatorConstraint({ name: 'isFutureDate', async: false })
class FutureDate implements ValidatorConstraintInterface {
  validate(text: string) {
    return new Date(text).getTime() >= Date.now();
  }
}
@ValidatorConstraint({ name: 'hasEither', async: false })
class HasEither implements ValidatorConstraintInterface {
  validate(_: string, args: ValidationArguments) {
    args.targetName = args.constraints.join(', ');
    return args.constraints.some((prop) => args.object[prop]);
  }
}
/** Equivalent to @MinDate(() => Date.now()) with an error message */
export const IsFutureDate = () => Validate(FutureDate);
/** Checks whether at least one of the given properties is provided. Use this decorator on any property EXCEPT those contained in the constraint list. */
export const HasSomeAmong = (...args: string[]) => Validate(HasEither, args);

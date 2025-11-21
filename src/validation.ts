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
  isWeekDate: ERROR_CODE.PARAM_DATE_MUST_BE_A_WEEK_DATE,
} satisfies {
  [constraint: string]: ERROR_CODE;
};

const errorsOnMultipleFields: string[] = ['hasEither']

export const validationExceptionFactory = (errors: ValidationError[]) => {
  // Map errors by constraint name
  const errorsByType: { [constraint: string]: string[] } = {};
  for (const error of errors) {
    if (error.children?.length) {
      return validationExceptionFactory(error.children);
    }
    for (const constraint of Object.keys(error.constraints)) {
      const field = errorsOnMultipleFields.includes(constraint as string) ? error.constraints[constraint] : error.property
      if (constraint in errorsByType) {
        errorsByType[constraint].push(field);
      } else {
        errorsByType[constraint] = [field];
      }
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
@ValidatorConstraint({ name: 'isWeekDate', async: false })
class WeekDate implements ValidatorConstraintInterface {
  validate(text: string): boolean {
    const date = new Date(text);
    return date.getWeekDate().getTime() === date.getTime();
  }
}
@ValidatorConstraint({ name: 'hasEither', async: false })
class HasEither implements ValidatorConstraintInterface {
  validate(_: string, args: ValidationArguments) {
    return args.constraints.some((prop) => args.object[prop]);
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return validationArguments.constraints.join(', ');
  }
}

/**
 * Used internally by HasEither.
 * Makes a property invisible to validation.
 */
@ValidatorConstraint({ name: 'ghostProperty', async: false })
class GhostProperty implements ValidatorConstraintInterface {
  validate(_: string, args: ValidationArguments) {
    return args.value === undefined;
  }
}

/** Equivalent to @MinDate(() => Date.now()) with an error message */
export const IsFutureDate = ({ each = false } = {}) => Validate(FutureDate, { each });

export const IsWeekDate = ({ each = false } = {}) => Validate(WeekDate, { each });

/** Checks whether at least one of the given properties is provided. Use this decorator on any property EXCEPT those contained in the constraint list. */
export function HasSomeAmong<T>(...fields: ((keyof T) & string)[]) {
  return (target: { prototype: T }) => {
    // Define a new property on the class.
    // This property will be used to apply the validator HasEither.
    // It will not be possible to fill it in the request with the GhostProperty validator.
    const propertyName = "_internalHasSomeAmong";
    const propertySymbol = Symbol(propertyName)
    Object.defineProperty(target.prototype, propertyName, {
      get() { return this[propertySymbol]; },
      set(value) { this[propertySymbol] = value; },
      enumerable: false,
      configurable: true,
    });
    // Apply GhostProperty decorator
    Validate(GhostProperty)(target.prototype, propertyName);
    // Apply HasEither decorator
    Validate(HasEither, fields)(target.prototype, propertyName);
  };
}

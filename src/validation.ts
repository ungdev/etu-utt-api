import { Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

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

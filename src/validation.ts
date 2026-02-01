import { Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

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

import { ValidationPipe } from '@nestjs/common';
import { AppException, ERROR_CODE } from './exceptions';

export const getValidationPipe = () =>
  new ValidationPipe({
    whitelist: true,
    exceptionFactory: (errors) => {
      const properties = errors.reduce(
        (values, value) =>
          values.indexOf(value.property) < 0
            ? [...values, value.property]
            : values,
        [],
      );
      return new AppException(ERROR_CODE.MALFORMED_PARAM, properties.join());
    },
  });

import { HttpException, HttpStatus } from '@nestjs/common';

export const enum ERROR_CODE {
  NOT_LOGGED_IN = 1001,
  PARAM_MALFORMED = 2001,
  PARAM_MISSING = 2002,
  PARAM_NOT_STRING = 2003,
  PARAM_NOT_ALPHANUMERIC = 2004,
  PARAM_NOT_NUMBER = 2005,
  PARAM_NOT_ENUM = 2006,
  PARAM_NOT_DATE = 2007,
  PARAM_TOO_LONG = 2008,
  PARAM_TOO_SHORT = 2009,
  PARAM_NOT_POSITIVE = 2010,
  PARAM_TOO_LOW = 2011,
  PARAM_TOO_HIGH = 2012,
  NOT_AN_UUID = 2101,
  FORBIDDEN_NOT_ENOUGH_PERMISSIONS = 3001,
  FORBIDDEN_NOT_LOGGED_IN = 3002,
  FORBIDDEN_ALREADY_COMMENTED = 3101,
  NOT_COMMENT_AUTHOR = 4221,
  NOT_ALREADY_DONE_UE = 4222,
  NOT_REPLY_AUTHOR = 4223,
  IS_COMMENT_AUTHOR = 4224,
  NO_SUCH_UE = 4401,
  NO_SUCH_COMMENT = 4402,
  NO_SUCH_REPLY = 4403,
  NO_SUCH_CRITERION = 4404,
}

export const ErrorData: Readonly<{
  [error in ERROR_CODE]: {
    message: string;
    httpCode: HttpStatus;
  };
}> = Object.freeze({
  [ERROR_CODE.NOT_LOGGED_IN]: {
    message: 'You must be logged in to access this resource',
    httpCode: HttpStatus.UNAUTHORIZED,
  },
  [ERROR_CODE.PARAM_MALFORMED]: {
    message: 'The following parameters are invalid: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_MISSING]: {
    message: 'The following parameters are missing: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_NOT_STRING]: {
    message: 'The following parameters must be string: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_NOT_ALPHANUMERIC]: {
    message: 'The following parameters must be alphanumeric: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_NOT_NUMBER]: {
    message: 'The following parameters must be number: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_NOT_ENUM]: {
    message: 'The following parameters must be enum members: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_NOT_DATE]: {
    message: 'The following parameters must be date: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_TOO_LONG]: {
    message: 'The following parameters are too long: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_TOO_SHORT]: {
    message: 'The following parameters are too short: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_NOT_POSITIVE]: {
    message: 'The following parameters must be positive: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_TOO_LOW]: {
    message: 'The following parameters must be higher: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_TOO_HIGH]: {
    message: 'The following parameters must be lower: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.NOT_AN_UUID]: {
    message: 'The given id is not a valid UUID',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.FORBIDDEN_NOT_ENOUGH_PERMISSIONS]: {
    message: 'Missing permission %',
    httpCode: HttpStatus.FORBIDDEN,
  },
  [ERROR_CODE.FORBIDDEN_NOT_LOGGED_IN]: {
    message: 'You must be logged in to access this page',
    httpCode: HttpStatus.UNAUTHORIZED,
  },
  [ERROR_CODE.FORBIDDEN_ALREADY_COMMENTED]: {
    message: 'You have already posted a comment for this UE',
    httpCode: HttpStatus.FORBIDDEN,
  },
  [ERROR_CODE.NOT_COMMENT_AUTHOR]: {
    message: 'You are not the author of this comment',
    httpCode: HttpStatus.FORBIDDEN,
  },
  [ERROR_CODE.NOT_ALREADY_DONE_UE]: {
    message: 'You must have done this UE before to perform this action',
    httpCode: HttpStatus.FORBIDDEN,
  },
  [ERROR_CODE.NOT_REPLY_AUTHOR]: {
    message: 'You are not the author of this reply',
    httpCode: HttpStatus.FORBIDDEN,
  },
  [ERROR_CODE.IS_COMMENT_AUTHOR]: {
    message: 'You are the author of this comment',
    httpCode: HttpStatus.FORBIDDEN,
  },
  [ERROR_CODE.NO_SUCH_UE]: {
    message: 'The UE % does not exist',
    httpCode: HttpStatus.NOT_FOUND,
  },
  [ERROR_CODE.NO_SUCH_COMMENT]: {
    message: 'This comment does not exist',
    httpCode: HttpStatus.NOT_FOUND,
  },
  [ERROR_CODE.NO_SUCH_REPLY]: {
    message: 'This reply does not exist',
    httpCode: HttpStatus.NOT_FOUND,
  },
  [ERROR_CODE.NO_SUCH_CRITERION]: {
    message: 'This criterion does not exist',
    httpCode: HttpStatus.NOT_FOUND,
  },
});

export class AppException extends HttpException {
  constructor(code: ERROR_CODE, extraMessage?: string) {
    super(
      {
        errorCode: code,
        error: ErrorData[code].message.replace('%', extraMessage || ''),
      },
      ErrorData[code].httpCode,
    );
  }
}

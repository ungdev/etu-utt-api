import { HttpException, HttpStatus } from '@nestjs/common';

export const enum ERROR_CODE {
  FORBIDDEN_NOT_ENOUGH_PERMISSIONS = 3001,
  FORBIDDEN_NOT_LOGGED_IN = 3002,
  NOT_COMMENT_AUTHOR = 4221,
  NOT_ALREADY_DONE_UE = 4222,
  NOT_REPLY_AUTHOR = 4223,
  NO_SUCH_UE = 4401,
}

const Errors: {
  [error in ERROR_CODE]: {
    message: string;
    httpCode: HttpStatus;
  };
} = {
  [ERROR_CODE.FORBIDDEN_NOT_ENOUGH_PERMISSIONS]: {
    message: 'Missing permission %',
    httpCode: HttpStatus.FORBIDDEN,
  },
  [ERROR_CODE.FORBIDDEN_NOT_LOGGED_IN]: {
    message: 'You must be logged in to access this page',
    httpCode: HttpStatus.UNAUTHORIZED,
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
  [ERROR_CODE.NO_SUCH_UE]: {
    message: "L'UE % n'existe pas",
    httpCode: HttpStatus.NOT_FOUND,
  },
};

export class AppException extends HttpException {
  constructor(code: ERROR_CODE, extraMessage?: string) {
    super(
      {
        errorCode: code,
        error: Errors[code].message.replace('%', extraMessage || ''),
      },
      Errors[code].httpCode,
    );
  }
}
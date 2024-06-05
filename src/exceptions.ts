import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Error codes
 * @enum {number} ERROR_CODE - Error codes used in the API to identify errors and send the correct
 * HTTP status code and message to the client.
 * All error data is stored in {@link ErrorData}.
 *
 * Guidelines for error codes:
 * - 1xxx: Authentication errors
 * - 2xxx: Parameter errors
 * - 3xxx: Permission errors. This includes all http 403 errors.
 * - 4xxx: Resource errors. This includes all http 404 errors.
 */
export const enum ERROR_CODE {
  NOT_LOGGED_IN = 1001,
  PARAM_DOES_NOT_EXIST = 2001,
  PARAM_MALFORMED = 2002,
  PARAM_MISSING = 2003,
  PARAM_NOT_STRING = 2004,
  PARAM_NOT_ALPHANUMERIC = 2005,
  PARAM_NOT_NUMBER = 2006,
  PARAM_NOT_ENUM = 2007,
  PARAM_NOT_DATE = 2008,
  PARAM_NOT_UUID = 2009,
  PARAM_TOO_LONG = 20010,
  PARAM_TOO_SHORT = 2011,
  PARAM_SIZE_TOO_SMALL = 2012,
  PARAM_SIZE_TOO_BIG = 2013,
  PARAM_IS_EMPTY = 2014,
  PARAM_NOT_POSITIVE = 2015,
  PARAM_TOO_LOW = 2016,
  PARAM_TOO_HIGH = 2017,
  PARAM_NOT_INTEGER = 2018,
  PARAM_DOES_NOT_MATCH_REGEX = 2102,
  NO_FIELD_PROVIDED = 2201,
  WIDGET_OVERLAPPING = 2301,
  FORBIDDEN_NOT_ENOUGH_PERMISSIONS = 3001,
  NO_TOKEN = 3002,
  INVALID_TOKEN_FORMAT = 3003,
  INVALID_CREDENTIALS = 3004,
  INVALID_CAS_TICKET = 3005,
  FORBIDDEN_ALREADY_COMMENTED = 3101,
  FORBIDDEN_ALREADY_UPVOTED = 3102,
  FORBIDDEN_ALREADY_UNUPVOTED = 3103,
  NOT_COMMENT_AUTHOR = 4221,
  NOT_ALREADY_DONE_UE = 4222,
  NOT_REPLY_AUTHOR = 4223,
  IS_COMMENT_AUTHOR = 4224,
  GROUP_NOT_PART_OF_ENTRY = 4225,
  NOT_ALREADY_RATED_UE = 4226,
  NO_SUCH_UE = 4401,
  NO_SUCH_COMMENT = 4402,
  NO_SUCH_REPLY = 4403,
  NO_SUCH_CRITERION = 4404,
  NO_SUCH_TIMETABLE_ENTRY = 4405,
  NO_SUCH_TIMETABLE_GROUP = 4406,
  NO_SUCH_USER = 4407,
  NO_SUCH_ASSO = 4408,
  CREDENTIALS_ALREADY_TAKEN = 5001,
}

/**
 * Error data for each error code used in the API.
 * This is used to send the correct HTTP status code and message to the client.
 * The message can contain `%` characters, which will be replaced by data when throwing the {@link AppException}.
 */
export const ErrorData = Object.freeze({
  [ERROR_CODE.NOT_LOGGED_IN]: {
    message: 'You must be logged in to access this resource',
    httpCode: HttpStatus.UNAUTHORIZED,
  },
  [ERROR_CODE.PARAM_DOES_NOT_EXIST]: {
    message: 'The parameter % does not exist',
    httpCode: HttpStatus.BAD_REQUEST,
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
  [ERROR_CODE.PARAM_NOT_UUID]: {
    message: 'The following parameters must be a valid UUID: %',
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
  [ERROR_CODE.PARAM_SIZE_TOO_SMALL]: {
    message: 'The following parameters are too small: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_SIZE_TOO_BIG]: {
    message: 'The following parameters are too big: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_IS_EMPTY]: {
    message: 'The following parameters are empty: %',
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
  [ERROR_CODE.PARAM_NOT_INTEGER]: {
    message: 'The following parameters must be integer: %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.PARAM_DOES_NOT_MATCH_REGEX]: {
    message: 'The following parameters must match the regex "%": %',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.NO_FIELD_PROVIDED]: {
    message: 'You must provide at least one field',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.WIDGET_OVERLAPPING]: {
    message: 'Widgets at index % and % are overlapping',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.FORBIDDEN_NOT_ENOUGH_PERMISSIONS]: {
    message: 'Missing permission %',
    httpCode: HttpStatus.FORBIDDEN,
  },
  [ERROR_CODE.NO_TOKEN]: {
    message: 'No token provided',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.INVALID_TOKEN_FORMAT]: {
    message: 'Token format is invalid',
    httpCode: HttpStatus.BAD_REQUEST,
  },
  [ERROR_CODE.INVALID_CREDENTIALS]: {
    message: 'Credentials incorrect',
    httpCode: HttpStatus.UNAUTHORIZED,
  },
  [ERROR_CODE.INVALID_CAS_TICKET]: {
    message: 'The ticket or the service is invalid',
    httpCode: HttpStatus.UNAUTHORIZED,
  },
  [ERROR_CODE.FORBIDDEN_ALREADY_COMMENTED]: {
    message: 'You have already posted a comment for this UE',
    httpCode: HttpStatus.FORBIDDEN,
  },
  [ERROR_CODE.FORBIDDEN_ALREADY_UPVOTED]: {
    message: 'You must un-upvote this comment before upvoting it again',
    httpCode: HttpStatus.FORBIDDEN,
  },
  [ERROR_CODE.FORBIDDEN_ALREADY_UNUPVOTED]: {
    message: 'You must upvote this comment before un-upvoting it',
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
  [ERROR_CODE.GROUP_NOT_PART_OF_ENTRY]: {
    message: 'The group % is not part of the timetable entry %',
    httpCode: HttpStatus.FORBIDDEN,
  },
  [ERROR_CODE.NOT_ALREADY_RATED_UE]: {
    message: 'You must have rated the UE % (on criterion %) before deleting your rating',
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
  [ERROR_CODE.NO_SUCH_TIMETABLE_ENTRY]: {
    message: 'The timetable entry % does not exist',
    httpCode: HttpStatus.NOT_FOUND,
  },
  [ERROR_CODE.NO_SUCH_TIMETABLE_GROUP]: {
    message: 'The timetable group % does not exist',
    httpCode: HttpStatus.NOT_FOUND,
  },
  [ERROR_CODE.NO_SUCH_USER]: {
    message: 'The user % does not exist',
    httpCode: HttpStatus.NOT_FOUND,
  },
  [ERROR_CODE.NO_SUCH_ASSO]: {
    message: 'The asso % does no exist',
    httpCode: HttpStatus.NOT_FOUND,
  },
  [ERROR_CODE.CREDENTIALS_ALREADY_TAKEN]: {
    message: 'The given credentials are already taken',
    httpCode: HttpStatus.CONFLICT,
  },
} as const) satisfies Readonly<{
  [error in ERROR_CODE]: {
    message: string;
    httpCode: HttpStatus;
  };
}>;

/**
 * Counts the number of occurrences of a string in another string. It the returns a string array type with that number of elements.
 * @example
 * type A = ExtrasTypeBuilder<'hello', '%'>; // []
 * type B = ExtrasTypeBuilder<'%hel%lo%', '%'>; // [string, string, string]
 */
export type ExtrasTypeBuilder<S extends string> = S extends `${infer Part1}%${infer Part2}`
  ? [...ExtrasTypeBuilder<Part1>, ...ExtrasTypeBuilder<Part2>, string]
  : [];

/**
 * An exception that can be thrown in the API. Every exception should be thrown using this class, to ensure that the errors are normalized.
 * @param ErrorCode The error code of the exception.
 * @param extraMessages Strings that will replace the `%` characters in the error message.
 *                      You have to specify as many extra messages as there are `%` characters in the error message.
 *
 * @example
 * throw new AppException(ERROR_CODE.NOT_LOGGED_IN);  // The error message will be : "You must be logged in to access this resource"
 * throw new AppException(ERROR_CODE.PARAM_NOT_UUID, 'groups');  // The error message will be : "The following parameters must be a valid UUID: groups"
 * throw new AppException(ERROR_CODE.PARAM_DOES_NOT_MATCH_REGEX, '^[0-9]{10}$', 'phoneNumber');  // The error message will be : "The following parameters must match the regex "^[0-9]{10}$": phoneNumber"
 */
export class AppException<ErrorCode extends ERROR_CODE> extends HttpException {
  constructor(code: ErrorCode, ...extraMessages: ExtrasTypeBuilder<(typeof ErrorData)[ErrorCode]['message']>) {
    super(
      {
        errorCode: code,
        error: (extraMessages as string[]).reduce(
          (message, extra) => message.replaceAll('%', extra),
          ErrorData[code].message,
        ),
      },
      ErrorData[code].httpCode,
    );
  }
}

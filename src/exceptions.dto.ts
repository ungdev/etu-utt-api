import {ERROR_CODE, ErrorData} from "./exceptions";
import {applyDecorators, HttpStatus} from "@nestjs/common";
import * as ApiResponses from "@nestjs/swagger";

export const ApiAppErrorResponse = (error: ERROR_CODE, description: string = "") => {
  const httpCode = ErrorData[error].httpCode;
  const httpErrorName = HttpStatus[httpCode];
  const toPascalCase = httpErrorName.split('_').map(part => part[0].toUpperCase() + part.slice(1).toLowerCase()).join('');
  class AppErrorResponseDto {
    errorCode = error;
    error = ErrorData[error].message;
  }
  return applyDecorators(ApiResponses[`Api${toPascalCase}Response`]({type: AppErrorResponseDto, description}))
}

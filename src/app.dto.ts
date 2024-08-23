import { ERROR_CODE, ErrorData } from './exceptions';
import { applyDecorators, HttpStatus, Injectable } from '@nestjs/common';
import * as ApiResponses from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common/interfaces/type.interface';

// Redefine the mixin function in node_modules/.pnpm/@nestjs+common@10.3.1_class-transformer@0.5.1_class-validator@0.14.1_reflect-metadata@0.1.14_rxjs@7.8.1/node_modules/@nestjs/common/decorators/core/injectable.decorator.js
// This implementation allows to give a name to the class
function mixin<T>(class_: Type<T>, newClassName: string): Type<T> {
  Object.defineProperty(class_, 'name', { value: newClassName });
  Injectable()(class_);
  return class_;
}

export const ApiAppErrorResponse = (error: ERROR_CODE, description = '') => {
  const httpCode = ErrorData[error].httpCode;
  const httpErrorName = HttpStatus[httpCode];
  const toPascalCase = httpErrorName
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join('');
  class ResponseDto {
    @ApiProperty({ type: Number })
    errorCode = error;
    @ApiProperty({ type: String })
    error = ErrorData[error].message;
  }
  const ResponseDtoMixin = mixin(ResponseDto, `AppErrorResDto$${error}`);
  return applyDecorators(ApiResponses[`Api${toPascalCase}Response`]({ type: ResponseDtoMixin, description }));
};

// Credit : https://www.inextenso.dev/how-to-generate-generic-dtos-with-nestjs-and-swagger
type Constructor<T = any> = new (...args: any[]) => T;
export function paginatedResponseDto<TBase extends Constructor>(Base: TBase) {
  class ResponseDto {
    @ApiProperty({ description: 'Total number of items that where found' })
    itemCount: number;

    @ApiProperty({ description: 'Maximum number of items that can be sent back in a single request' })
    itemsPerPage: number;

    @ApiProperty({ isArray: true, type: Base })
    items: InstanceType<TBase>[];
  }
  return mixin(ResponseDto, `${Base.name}$Paginated`); // This is important otherwise you will get always the same instance
}

import { Optional } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export default class AssosMemberUpdateReqDto {
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissions: string[];

  @Optional()
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  @ValidateIf((date: Date) => date.getTime() > Date.now(), {
    message: 'endAt must be a date in the future',
  })
  endAt: Date;
}

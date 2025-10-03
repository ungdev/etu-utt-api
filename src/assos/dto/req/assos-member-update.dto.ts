import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsFutureDate } from '../../../validation';

export default class AssosMemberUpdateReqDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  roleId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsDate()
  @IsNotEmpty()
  @IsFutureDate()
  @Type(() => Date)
  endAt?: Date;
}

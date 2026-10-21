import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { IsFutureDate } from '@/validation.js';

export class AssosMemberCreateReqDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissions: string[];

  @IsOptional()
  @IsDate()
  @IsNotEmpty()
  @IsFutureDate()
  @Type(() => Date)
  endAt: Date;
}

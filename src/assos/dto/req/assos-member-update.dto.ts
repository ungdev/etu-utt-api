import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

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
  @Type(() => Date)
  @ValidateIf((date: string) => new Date(date).getTime() > Date.now(), {
    message: 'endAt must be a date in the future',
  })
  endAt?: Date;
}

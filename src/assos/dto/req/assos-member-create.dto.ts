import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export default class AssosMemberCreateReqDto {
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
  @Type(() => Date)
  @ValidateIf((date: string) => new Date(date).getTime() > Date.now(), {
    message: 'endAt must be a date in the future',
  })
  endAt: Date;
}

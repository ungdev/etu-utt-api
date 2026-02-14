import { IsDate, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export default class WeeklySearchReqDto {
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @IsOptional()
  @IsInt()
  page: number = 1;
}
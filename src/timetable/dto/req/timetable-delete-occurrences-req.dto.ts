import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsPositive, IsString, IsUUID } from 'class-validator';

export class TimetableDeleteOccurrencesReqDto {
  @IsInt()
  @IsNotEmpty()
  from: number;

  @IsInt()
  @IsNotEmpty()
  until: number;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  every: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsUUID(4, { each: true })
  for: string[];
}

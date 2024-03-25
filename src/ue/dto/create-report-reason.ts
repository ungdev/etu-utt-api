import { Optional } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsAlphanumeric, IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';

export class CreateReportReasonTranslation {
  @Optional()
  @IsString()
  fr?: string;

  @Optional()
  @IsString()
  en?: string;

  @Optional()
  @IsString()
  de?: string;

  @Optional()
  @IsString()
  es?: string;

  @Optional()
  @IsString()
  zh?: string;
}

export class CreateReportReason {
  @IsNotEmpty()
  @IsString()
  @IsAlphanumeric()
  name: string;

  @Optional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateReportReasonTranslation)
  translation?: CreateReportReasonTranslation;
}

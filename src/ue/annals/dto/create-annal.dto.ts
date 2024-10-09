import {
  IsAlphanumeric,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateAnnal {
  @IsString()
  @IsNotEmpty()
  @Length(3)
  semester: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  typeId: string;

  @IsString()
  @ValidateIf((obj: CreateAnnal) => !!obj.ueCode || !!obj.ueof)
  @IsNotEmpty()
  @IsAlphanumeric()
  @MinLength(3)
  @MaxLength(5)
  ueCode: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @MinLength(12)
  ueof?: string;
}

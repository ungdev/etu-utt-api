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

export class CreateAnnalReqDto {
  @IsString()
  @IsNotEmpty()
  @Length(3)
  semester: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  typeId: string;

  @IsString()
  @ValidateIf((obj: CreateAnnalReqDto) => !!obj.ueCode || !!obj.ueof)
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

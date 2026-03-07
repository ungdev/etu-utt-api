import {
  IsAlphanumeric,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { HasSomeAmong } from '@/validation';

@HasSomeAmong('ueCode', 'ueof')
export class CreateAnnalReqDto {
  @IsString()
  @IsNotEmpty()
  @Length(3)
  semester: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  typeId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsAlphanumeric()
  @MinLength(3)
  @MaxLength(5)
  ueCode?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @MinLength(12)
  ueof?: string;
}

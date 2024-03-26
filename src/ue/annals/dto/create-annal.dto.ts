import { IsAlphanumeric, IsDefined, IsNotEmpty, IsString, IsUUID, Length, MaxLength, MinLength } from 'class-validator';

export class CreateAnnal {
  @IsNotEmpty()
  @IsString()
  @Length(3)
  semester: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  typeId: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(5)
  @IsAlphanumeric()
  ueCode: string;
}

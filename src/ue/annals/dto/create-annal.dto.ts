import { IsAlphanumeric, IsNotEmpty, IsString, IsUUID, Length, MaxLength, MinLength } from 'class-validator';

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
  @IsNotEmpty()
  @IsAlphanumeric()
  @MinLength(3)
  @MaxLength(5)
  ueCode: string;
}

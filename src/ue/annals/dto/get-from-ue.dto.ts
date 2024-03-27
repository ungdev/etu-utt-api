import { IsAlphanumeric, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class GetFromUeCodeDto {
  @IsString()
  @IsNotEmpty()
  @IsAlphanumeric()
  @MinLength(3)
  @MaxLength(5)
  ueCode: string;
}

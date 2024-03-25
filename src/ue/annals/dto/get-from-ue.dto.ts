import { IsAlphanumeric, IsDefined, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Query parameters to get comments.
 * @property page The page number to get. Defaults to 1 (Starting at 1).
 */
export class GetFromUeCodeDto {
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(5)
  @IsAlphanumeric()
  ueCode: string;
}

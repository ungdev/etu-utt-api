import { IsAlphanumeric, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export default class AuthSignUpDebugReqDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  login: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  mail: string;

  @IsPositive()
  @Type(() => Number)
  tokenExpiresIn: number;
}

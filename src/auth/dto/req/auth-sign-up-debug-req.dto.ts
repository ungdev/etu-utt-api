import { IsAlphanumeric, IsNotEmpty, IsOptional, IsString, IsPositive, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { UserType } from '@/prisma/types.js';

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

  @IsEnum(UserType)
  @IsOptional()
  userType: UserType = UserType.STUDENT;
}

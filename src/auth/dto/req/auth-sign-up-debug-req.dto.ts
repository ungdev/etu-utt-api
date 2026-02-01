import { IsAlphanumeric, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { Sex } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

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

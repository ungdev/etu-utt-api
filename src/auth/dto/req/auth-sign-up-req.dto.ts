import { IsAlphanumeric, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { Sex } from '@prisma/client';
import {ApiProperty} from "@nestjs/swagger";

export default class AuthSignUpReqDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  studentId?: number;

  @IsString()
  @IsOptional()
  mail?: string;

  @IsEnum(Sex)
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({ enum: Sex })
  sex?: Sex;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  @IsOptional()
  birthday?: Date;
}

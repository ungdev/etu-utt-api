import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AuthSignInDto } from './auth-sign-in.dto';
import { IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { Sex, UserRole } from '@prisma/client';

export class AuthSignUpDto extends AuthSignInDto {
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

  @IsEnum(Sex)
  @IsNotEmpty()
  sex: Sex;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  birthday: Date;

  @IsEnum(UserRole)
  role: UserRole;
}

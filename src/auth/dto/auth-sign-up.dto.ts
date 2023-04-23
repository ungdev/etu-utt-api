import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { AuthSignInDto } from './auth-sign-in.dto';
import { IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

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
  studentId?: number;
}

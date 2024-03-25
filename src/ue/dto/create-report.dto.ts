import { IsAlphanumeric, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReport {
  @IsNotEmpty()
  @IsString()
  @IsAlphanumeric()
  reason: string;

  @IsString()
  @MaxLength(1024)
  details: string;
}

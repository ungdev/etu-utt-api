import { Optional } from '@nestjs/common';
import { IsNotEmpty, IsString, Length, IsUUID } from 'class-validator';

export class UpdateAnnal {
  @IsNotEmpty()
  @IsString()
  @Length(3)
  @Optional()
  semester?: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  @Optional()
  typeId?: string;
}

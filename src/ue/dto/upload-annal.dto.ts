import { Optional } from '@nestjs/common';
import { IsInt, IsNotEmpty, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class UploadAnnal {
  @IsNotEmpty()
  @IsString()
  @Length(3)
  semester: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  typeId: string;

  @Optional()
  @IsInt()
  @Max(1)
  @Min(-1)
  rotate?: -1 | 0 | undefined | 1;
}

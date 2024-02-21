import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class UploadAnnal {
  @IsNotEmpty()
  @IsString()
  @Length(3)
  semester: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  typeId: string;
}

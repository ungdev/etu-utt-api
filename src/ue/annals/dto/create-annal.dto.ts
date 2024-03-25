import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class CreateAnnal {
  @IsNotEmpty()
  @IsString()
  @Length(3)
  semester: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  typeId: string;
}

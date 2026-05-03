import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class UpdateAnnalReqDto {
  @IsNotEmpty()
  @IsString()
  @Length(3)
  @IsOptional()
  semester?: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  @IsOptional()
  typeId?: string;
}

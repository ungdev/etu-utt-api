import { IsNotEmpty, IsString, Length, IsUUID, IsOptional } from 'class-validator';

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

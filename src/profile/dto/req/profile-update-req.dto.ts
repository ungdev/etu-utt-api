import { IsOptional, IsString } from 'class-validator';

export class ProfileUpdateReqDto {
  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  passions?: string;

  @IsString()
  @IsOptional()
  website?: string;
}

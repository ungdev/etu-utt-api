import { IsOptional, IsString } from 'class-validator';

export class ProfileUpdateDto {
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

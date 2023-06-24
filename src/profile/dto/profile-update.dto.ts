import { IsOptional } from 'class-validator';

export class ProfileUpdateDto {
  @IsOptional()
  nickname?: string;

  @IsOptional()
  passions?: string;

  @IsOptional()
  website?: string;
}

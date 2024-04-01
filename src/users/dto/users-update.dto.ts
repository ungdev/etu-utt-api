import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UserUpdateDto {
  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  passions?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  mailPersonal?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  facebook?: string;

  @IsString()
  @IsOptional()
  twitter?: string;

  @IsString()
  @IsOptional()
  instagram?: string;

  @IsString()
  @IsOptional()
  linkedin?: string;

  @IsString()
  @IsOptional()
  twitch?: string;

  @IsString()
  @IsOptional()
  spotify?: string;

  @IsString()
  @IsOptional()
  pseudoDiscord?: string;

  @IsBoolean()
  @IsOptional()
  wantDiscordUTT?: boolean;

  @IsBoolean()
  @IsOptional()
  displayBirthday?: boolean;

  @IsBoolean()
  @IsOptional()
  displayMailPersonal?: boolean;

  @IsBoolean()
  @IsOptional()
  displayPhone?: boolean;

  @IsBoolean()
  @IsOptional()
  displayAddress?: boolean;

  @IsBoolean()
  @IsOptional()
  displaySex?: boolean;

  @IsBoolean()
  @IsOptional()
  displayDiscord?: boolean;

  @IsBoolean()
  @IsOptional()
  displayTimetable?: boolean;
}

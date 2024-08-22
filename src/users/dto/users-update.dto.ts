import { AddressPrivacy, Language } from '@prisma/client';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

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

  @IsOptional()
  @IsArray({ each: true })
  addresses?: Address[];

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
  discord?: string;

  @IsEnum(Language)
  @IsOptional()
  language?: Language;

  @IsBoolean()
  @IsOptional()
  wantDiscordUtt?: boolean;

  @IsBoolean()
  @IsOptional()
  wantDaymail?: boolean;

  @IsBoolean()
  @IsOptional()
  wantDayNotif?: boolean;

  @IsBoolean()
  @IsOptional()
  displayBirthday?: boolean;

  @IsBoolean()
  @IsOptional()
  displayMailPersonal?: boolean;

  @IsBoolean()
  @IsOptional()
  displayPhone?: boolean;

  @IsEnum(AddressPrivacy)
  @IsOptional()
  displayAddress?: AddressPrivacy;

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

class Address {
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
}

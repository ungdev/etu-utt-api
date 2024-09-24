import { ApiProperty } from '@nestjs/swagger';
import { AddressPrivacy, Sex, UserType } from '@prisma/client';

export default class UserDetailResDto {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  @ApiProperty({ enum: UserType })
  type: UserType;
  avatar?: string;
  @ApiProperty({ enum: UserType })
  sex?: Sex;
  nationality?: string;
  birthday?: Date;
  passions?: string;
  website?: string;
  branch?: string;
  semester?: number;
  branchOption: string;
  mailUTT: string;
  mailPersonal?: string;
  phone?: string;
  addresses: UserOverviewResDto_Address[];
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  twitch?: string;
  spotify?: string;
  discord?: string;
  infoDisplayed?: UserOverviewResDto_InfoDisplayed;
}

class UserOverviewResDto_Address {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

class UserOverviewResDto_InfoDisplayed {
  displayBirthday: boolean;
  displayMailPersonal: boolean;
  displayPhone: boolean;
  @ApiProperty({ enum: AddressPrivacy })
  displayAddress: AddressPrivacy;
  displaySex: boolean;
  displayDiscord: boolean;
  displayTimetable: boolean;
}

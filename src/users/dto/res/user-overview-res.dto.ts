import { ApiProperty } from '@nestjs/swagger';
import { Permission, Sex, UserType } from '@prisma/client';

export default class UserOverviewResDto {
  id: string;
  firstName: string;
  lastName: string;
  login: string;
  studentId: number;
  @ApiProperty({ enum: Permission })
  permissions: Permission[];
  @ApiProperty({ enum: UserType })
  userType: UserType;
  infos: UserOverviewResDto_Infos;
  branchSubscriptions?: string[];
  mailsPhones: UserOverviewResDto_MailsPhones;
  socialNetwork: UserOverviewResDto_SocialNetwork;
  addresses: UserOverviewResDto_Address[];
}

class UserOverviewResDto_Infos {
  nickname?: string;
  avatar?: string;
  nationality?: string;
  passions?: string;
  website?: string;
  @ApiProperty({ enum: UserType })
  sex?: Sex;
  birthday?: Date;
}

class UserOverviewResDto_MailsPhones {
  mailUTT: string;
  mailPersonal?: string;
  phoneNumber?: string;
}

class UserOverviewResDto_SocialNetwork {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  twitch?: string;
  spotify?: string;
  discord?: string;
}

class UserOverviewResDto_Address {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

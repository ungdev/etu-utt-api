import {PrismaClient, UserType} from '@prisma/client';
import { QueryFunction } from '../make-migration';
import { RawSemester, RawUE, RawUser } from '../../../src/prisma/types';

export async function migrateUsers(query: QueryFunction, prisma: PrismaClient, ues: RawUE[], currentSemester: RawSemester) {
  const users = await query('SELECT * FROM etu_users LIMIT 10');
  const promises: Array<Promise<RawUser>> = [];
  for (const user of users) {
    promises.push(
      prisma.user.create({
        data: {
          login: user.login,
          hash: '', // it is not possible to migrate the password, it's not possible to hash a password to an empty string
          studentId: user.studentId,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.isStudent ? UserType.STUDENT : UserType.EMPLOYEE,
          mailsPhones: {
            create: {
              mailUTT: user.mail,
              mailPersonal: user.personnalMail,
            },
          },
          infos: {
            create: {
              birthday: user.birthday,
              nickname: user.surnom,
              passions: user.passions,
              website: user.website,
              sex: user.sex,
              avatar: user.avatar,
              nationality: user.nationality,
            },
          },
          socialNetwork: {
            create: {
              facebook: user.facebook,
              twitter: user.twitter,
              linkedin: user.linkedin,
              discord: user.discordTag,
            },
          },
          privacy: {
            create: {
              mailUTT: true,
              mailPersonal: user.personnalMail,
              phoneNumber: user.phoneNumberPrivacy,
              birthday: user.birthdayPrivacy,
              birthdayDisplayOnlyAge: user.birthdayDisplayOnlyAge,
              sex: user.sexPrivacy,
              nationality: user.nationalityPrivacy,
              discord: user.discordTagPrivacy,
              address: !user.countryPrivacy
                ? 'ALL_PRIVATE'
                : !user.cityPrivacy
                ? 'CITY_PRIVATE'
                : !user.addressPrivacy
                ? 'ADDRESS_PRIVATE'
                : 'ALL_PUBLIC',
            },
          },
          rgpd: {
            create: {
              isKeepingAccount: user.isKeepingAccount,
              isDeletingEverything: user.isDeletingEverything,
            },
          },
          preference: {
            create: {
              wantDaymail: user.daymail,
              language: user.language,
              wantDayNotif: false,
              wantDiscordUtt: user.wantsJoinUTTDiscord,
            },
          },
          addresses: {
            create: {
              city: user.city,
              country: user.country,
              postalCode: user.postalCode,
              street: user.address,
            },
          },
          UEsSubscriptions: {
            createMany: {
              data: user.uvs.split('|').map((code) => ({
                ueId: ues.find((ue) => ue.code === code).id,
                semesterId: currentSemester.code,
              })),
            },
          },
        },
      }),
    );
  }
  return Promise.all(promises);
}

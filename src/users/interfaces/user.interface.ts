import { Permission, Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel, RequestType } from '../../prisma/prisma.service';
import { Translation } from '../../prisma/types';
import { omit } from '../../utils';

const USER_SELECT_FILTER = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    login: true,
    studentId: true,
    userType: true,
    infos: {
      select: {
        nickname: true,
        website: true,
        passions: true,
        birthday: true,
        sex: true,
        avatar: true,
        nationality: true,
      },
    },
    branchSubscriptions: {
      select: {
        semesterNumber: true,
        semester: {
          select: {
            code: true,
            start: true,
            end: true,
          },
        },

        branchOption: {
          select: {
            code: true,
            branch: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    },
    mailsPhones: {
      select: {
        mailUTT: true,
        mailPersonal: true,
        phoneNumber: true,
      },
    },
    socialNetwork: {
      select: {
        discord: true,
        facebook: true,
        instagram: true,
        linkedin: true,
        spotify: true,
        twitch: true,
        twitter: true,
      },
    },
    preference: {
      select: {
        wantDayNotif: true,
        language: true,
        wantDaymail: true,
        wantDiscordUtt: true,
      },
    },
    addresses: {
      select: {
        street: true,
        postalCode: true,
        city: true,
        country: true,
      },
    },
    privacy: {
      select: {
        mailUTT: true,
        mailPersonal: true,
        phoneNumber: true,
        birthday: true,
        birthdayDisplayOnlyAge: true,
        sex: true,
        nationality: true,
        discord: true,
        address: true,
        timetable: true,
      },
    },
    apiKeys: {
      select: {
        id: true,
        apiKeyPermissions: {
          select: {
            id: true,
            permission: true,
            userId: true,
          },
        },
      },
    },
  },
  orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
} satisfies Partial<RequestType<'user'>>;

type UnformattedUser = Prisma.UserGetPayload<typeof USER_SELECT_FILTER>;
export type User = Omit<UnformattedUser, 'apiKeys'> & {
  permissions: { [k: string]: { [p in Permission]?: '*' | string[] } };
};

export const generateCustomUserModel = (prisma: PrismaClient) =>
  generateCustomModel(prisma, 'user', USER_SELECT_FILTER, formatUser);

function formatUser(_, user: UnformattedUser) {
  const permissions: User['permissions'] = {};
  for (const apiKey of user.apiKeys) {
    permissions[apiKey.id] = {};
    for (const permission of apiKey.apiKeyPermissions) {
      if (!permission.userId) {
        // Hard grant
        permissions[apiKey.id][permission.permission] = '*';
      } else {
        // Soft grant
        if (!permission[apiKey.id][permission.permission]) {
          permissions[apiKey.id][permission.permission] = [];
        }
        (permissions[apiKey.id][permission.permission] as string[]).push(permission.userId);
      }
    }
  }
  return { ...omit(user, 'apiKeys'), permissions };
}

export type UserAssoMembership = {
  startAt: Date;
  endAt: Date;
  role: string;
  asso: AssoResume;
};

export type AssoResume = {
  name: string;
  logo: string;
  descriptionShortTranslation: Translation;
  mail: string;
};

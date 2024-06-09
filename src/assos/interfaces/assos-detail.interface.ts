import { Prisma } from '@prisma/client';

const ASSOS_DETAIL_SELECT_FILTER = {
  select: {
    id: true,
    login: true,
    name: true,
    mail: true,
    phoneNumber: true,
    website: true,
    logo: true,
    descriptionTranslation: {
      select: {
        fr: true,
        en: true,
        es: true,
        de: true,
        zh: true,
      },
    },
  },
} as const satisfies Prisma.AssoFindManyArgs;

export type AssosDetail = Prisma.AssoGetPayload<typeof ASSOS_DETAIL_SELECT_FILTER>;

export function SelectAssoDetail<T>(arg: T): T & typeof ASSOS_DETAIL_SELECT_FILTER {
  return {
    ...arg,
    ...ASSOS_DETAIL_SELECT_FILTER,
  } as const;
}

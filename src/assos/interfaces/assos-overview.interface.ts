import { Prisma } from '@prisma/client';

const ASSOS_OVERVIEW_SELECT_FILTER = {
  select: {
    id: true,
    name: true,
    logo: true,
    descriptionShortTranslation: {
      select: {
        fr: true,
        en: true,
        es: true,
        de: true,
        zh: true,
      },
    },
  },
} as const;

export type AssosOverView = DeepWritable<Prisma.AssoGetPayload<typeof ASSOS_OVERVIEW_SELECT_FILTER>>;

export function SelectAssosOverview<T>(arg: T): T & typeof ASSOS_OVERVIEW_SELECT_FILTER {
  return {
    ...arg,
    ...ASSOS_OVERVIEW_SELECT_FILTER,
  } as const;
}

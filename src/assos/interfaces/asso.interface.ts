import {Prisma, PrismaClient} from '@prisma/client';
import {generateCustomModel} from "../../prisma/prisma.service";
import {translationSelect} from "../../utils";

const ASSO_SELECT_FILTER = {
  select: {
    id: true,
    login: true,
    name: true,
    mail: true,
    phoneNumber: true,
    website: true,
    logo: true,
    descriptionTranslation: translationSelect,
    descriptionShortTranslation: translationSelect,
  },
  orderBy: {
    name: 'asc',
  }
} as const satisfies Prisma.AssoFindManyArgs;

type UnformattedAsso = Prisma.AssoGetPayload<typeof ASSO_SELECT_FILTER>;
export type Asso = UnformattedAsso & { president: { role: { name: string }, user: {firstName: string; lastName: string} } };

export const generateCustomAssoModel = (prisma: PrismaClient) => generateCustomModel(prisma, 'asso', ASSO_SELECT_FILTER, formatAsso);

export async function formatAsso(prisma: PrismaClient, asso: UnformattedAsso): Promise<Asso> {
  const president = await prisma.assoMembership.findFirst({
    where: {
      asso: {
        id: asso.id,
      },
      role: {
        isPresident: true,
      },
    },
    select: {
      role: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
  return {
    ...asso,
    president,
  };
}

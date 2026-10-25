import { Prisma, PrismaClient, RawAssoMembership, RawAsso } from '@/prisma/types.js';
import { generateCustomModel } from '@/prisma/prisma.service.js';
import { translationSelect } from '@/utils.js';

const ASSO_SELECT_FILTER = {
  select: {
    id: true,
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
  },
} as const satisfies Prisma.AssoFindManyArgs;

type UnformattedAsso = Prisma.AssoGetPayload<typeof ASSO_SELECT_FILTER>;
export type Asso = UnformattedAsso & {
  president: { role: { id: string; name: string }; user?: { id: string; firstName: string; lastName: string } };
};

export const generateCustomAssoModel = (prisma: PrismaClient) =>
  generateCustomModel(prisma, 'asso', ASSO_SELECT_FILTER, formatAsso);

export async function formatAsso(prisma: PrismaClient, asso: UnformattedAsso): Promise<Asso> {
  const presidentRole = await prisma.assoMembershipRole.findFirst({
    where: { assoId: asso.id, isPresident: true },
    select: { id: true, name: true },
  });
  const presidentMembership = presidentRole
    ? await prisma.assoMembership.findFirst({
        where: { roleId: presidentRole.id },
        select: { user: { select: { id: true, firstName: true, lastName: true } } },
      })
    : null;
  return {
    ...asso,
    president: {
      role: presidentRole,
      user: presidentMembership ? presidentMembership.user : null,
    },
  };
}

export enum AssoAccessAction {
  CREATE = 'CREATE',
  CLAIM = 'CLAIM',
}

export type AssoAccessActionAndAssoId =
  | { action: AssoAccessAction.CREATE; assoId: null }
  | { action: AssoAccessAction.CLAIM; assoId: string };

export enum AssoAccessAttemptStatus {
  REQUESTED = 'REQUESTED',
  REJECTED = 'REJECTED',
  CONFIRMED = 'CONFIRMED',
  CONFIRM_FAILED = 'CONFIRM_FAILED',
}

export type AssoAccessTokenData = {
  userId: string;
  assoEmail: string;
  assoId?: string;
  action: AssoAccessAction;
  jti: string;
  iat: number;
  exp: number;
};

export type AssoAccessConfirmation =
  | { action: AssoAccessAction.CREATE; asso: RawAsso }
  | { action: AssoAccessAction.CLAIM; asso: Asso; membership: RawAssoMembership };

export type AssoInfo = {
  action: AssoAccessAction;
  email: string;
  name: string | null;
};

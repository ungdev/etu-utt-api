import { Prisma, PrismaClient } from '../prisma/types';
import { translationSelect } from '../utils';
import { generateCustomModel } from '../prisma/prisma.service';

const LINK_SELECT_FILTER = {
  select: {
    id: true,
    position: true,
    name: translationSelect,
    tooltip: translationSelect,
    hyperlink: true,
    public: true,
  },
} as const satisfies Prisma.LinkFindManyArgs;

export type Link = Prisma.LinkGetPayload<typeof LINK_SELECT_FILTER>;

export const generateCustomLinkModel = (prisma: PrismaClient) =>
  generateCustomModel(prisma, 'link', LINK_SELECT_FILTER, (_, e: Link) => e);

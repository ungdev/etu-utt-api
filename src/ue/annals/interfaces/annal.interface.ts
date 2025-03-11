import { Prisma, PrismaClient } from '@prisma/client';
import { omit } from '../../../utils';
import { CommentStatus } from '../../comments/interfaces/comment.interface';
import { generateCustomModel } from '../../../prisma/prisma.service';

const UE_ANNAL_SELECT_FILTER = {
  select: {
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    uploadComplete: true,
    id: true,
    semesterId: true,
    sender: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
    type: {
      select: {
        name: true,
        id: true,
      },
    },
    validatedAt: true,
    ueof: { select: { code: true, info: { select: { language: true } }, ue: { select: { code: true } } } },
  },
} satisfies Prisma.UeAnnalFindManyArgs;

type UnformattedUeAnnal = Prisma.UeAnnalGetPayload<typeof UE_ANNAL_SELECT_FILTER>;
export type UeAnnalFile = Omit<UnformattedUeAnnal, 'validatedAt' | 'deletedAt' | 'uploadComplete'> & {
  status: CommentStatus;
};

export function generateCustomUeAnnalModel(prisma: PrismaClient) {
  return generateCustomModel(prisma, 'ueAnnal', UE_ANNAL_SELECT_FILTER, formatAnnal);
}

export function formatAnnal(_: PrismaClient, annal: UnformattedUeAnnal): UeAnnalFile {
  return {
    ...omit(annal, 'deletedAt', 'validatedAt', 'uploadComplete'),
    status:
      (annal.deletedAt && CommentStatus.DELETED) |
      (annal.validatedAt && CommentStatus.VALIDATED) |
      (!annal.uploadComplete && CommentStatus.PROCESSING),
  };
}

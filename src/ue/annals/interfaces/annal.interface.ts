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
        firstName: true,
        lastName: true,
        id: true,
      },
    },
    type: {
      select: {
        name: true,
        id: true,
      },
    },
    validatedAt: true,
    ue: { select: { code: true } },
  },
} satisfies Prisma.UEAnnalFindManyArgs;

export type UnformattedUEAnnal = Prisma.UEAnnalGetPayload<typeof UE_ANNAL_SELECT_FILTER>;
export type UEAnnalFile = Omit<UnformattedUEAnnal, 'validatedAt' | 'deletedAt' | 'uploadComplete'> & {
  status: CommentStatus;
};

export function generateCustomUEAnnalModel(prisma: PrismaClient) {
  return generateCustomModel(prisma, 'uEAnnal', UE_ANNAL_SELECT_FILTER, formatAnnal);
}

export function formatAnnal(_: PrismaClient, annal: UnformattedUEAnnal): UEAnnalFile {
  return {
    ...omit(annal, 'deletedAt', 'validatedAt', 'uploadComplete'),
    status:
      (annal.deletedAt && CommentStatus.DELETED) |
      (annal.validatedAt && CommentStatus.VALIDATED) |
      (!annal.uploadComplete && CommentStatus.PROCESSING),
  };
}

import { Prisma } from '@prisma/client';
import { omit } from '../../utils';
import { CommentStatus } from './comment.interface';

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
  },
};

export type UEAnnalFile = Omit<
  Prisma.UEAnnalGetPayload<typeof UE_ANNAL_SELECT_FILTER>,
  'validatedAt' | 'deletedAt' | 'uploadComplete'
> & { status: CommentStatus };

/**
 * Generates the argument to use in prisma function to retrieve an object containing the necessary
 * properties to match against the {@link UEAnnalFile} type.
 */
export function SelectUEAnnalFile<T>(arg: T): T & typeof UE_ANNAL_SELECT_FILTER {
  return {
    ...arg,
    ...UE_ANNAL_SELECT_FILTER,
  } as const;
}

export function FormatAnnal<T extends Prisma.UEAnnalGetPayload<typeof UE_ANNAL_SELECT_FILTER>>(
  annal: T,
): UEAnnalFile & Omit<T, 'validatedAt' | 'deletedAt' | 'uploadComplete'> {
  return {
    ...omit(annal, 'validatedAt', 'deletedAt', 'uploadComplete'),
    status: annal.deletedAt
      ? CommentStatus.DELETED
      : annal.validatedAt
      ? CommentStatus.VALIDATED
      : annal.uploadComplete
      ? CommentStatus.UNVERIFIED
      : CommentStatus.PROCESSING,
  };
}

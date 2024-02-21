import { Prisma } from '@prisma/client';

const UE_ANNAL_SELECT_FILTER = {
  select: {
    createdAt: true,
    updatedAt: true,
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
    validatedById: true,
  },
};

export type UEAnnalFile = DeepWritable<Prisma.UEGetPayload<typeof UE_ANNAL_SELECT_FILTER>>;

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

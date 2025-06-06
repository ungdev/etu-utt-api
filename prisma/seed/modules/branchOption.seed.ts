import { faker } from '@faker-js/faker';
import { RawBranch, RawBranchOption } from '../../../src/prisma/types';
import { PrismaClient, PrismaPromise } from '@prisma/client';

const MAX_FAKER_ROUNDS = 4;

export default async function branchOptionSeed(
  prisma: PrismaClient,
  branches: RawBranch[],
): Promise<RawBranchOption[]> {
  console.log('Seeding branch options...');
  const branchOptions: PrismaPromise<RawBranchOption>[] = [];
  for (const branch of branches) {
    branchOptions.push(
      prisma.uTTBranchOption.create({
        data: {
          branch: { connect: { code: branch.code } },
          code: 'NC',
          name: 'Tronc commun de branche',
          descriptionTranslation: {
            create: {
              fr: "C'est avant la filière x)",
              en: 'Before the filière',
            },
          },
        },
      }),
    );
    const branchOptionsCount = faker.datatype.number({ min: 0, max: MAX_FAKER_ROUNDS });
    for (let i = 0; i < branchOptionsCount; i++) {
      branchOptions.push(
        prisma.uTTBranchOption.create({
          data: {
            branch: { connect: { code: branch.code } },
            code: faker.random.alpha({ casing: 'upper', count: faker.datatype.number({ min: 3, max: 6 }) }),
            name: faker.name.jobTitle(),
            descriptionTranslation: {
              create: {
                fr: faker.random.words(10),
                en: faker.random.words(10),
              },
            },
          },
        }),
      );
    }
  }
  return Promise.all(branchOptions);
}

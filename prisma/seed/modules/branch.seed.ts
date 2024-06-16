import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { RawBranch } from '../../../src/prisma/types';

const FAKER_ROUNDS = 8;

export default function branchSeed(prisma: PrismaClient): Promise<RawBranch[]> {
  console.log('Seeding branches');
  const branches: Promise<RawBranch>[] = [];
  branches.push(
    prisma.uTTBranch.create({
      data: {
        code: 'TC',
        name: 'Tronc commun',
        descriptionTranslation: {
          create: {
            fr: "2 années de cycle préparatoire au cycle ingénieur (aucune idée de si c'est la vraie description :eyes:)",
            en: '2 years of preparatory cycle to the engineering cycle',
          },
        },
      },
    }),
  );
  for (let i = 0; i < FAKER_ROUNDS; i++) {
    branches.push(
      prisma.uTTBranch.create({
        data: {
          code: faker.db.branch.code(),
          name: faker.name.jobTitle(),
          exitSalary: faker.datatype.number({ min: 1000, max: 10000 }),
          employmentRate: faker.datatype.float({ min: 0, max: 100 }),
          CDIRate: faker.datatype.float({ min: 0, max: 100 }),
          abroadEmploymentRate: faker.datatype.float({ min: 0, max: 100 }),
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
  return Promise.all(branches);
}

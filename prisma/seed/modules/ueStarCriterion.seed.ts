import { RawUeStarCriterion } from '../../../src/prisma/types';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const FAKER_ROUNDS = 5;

export default function ueStarCriterionSeed(prisma: PrismaClient): Promise<RawUeStarCriterion[]> {
  console.log('Seeding UE star criterion...');
  const criterions: Promise<RawUeStarCriterion>[] = [];
  for (let i = 0; i < FAKER_ROUNDS; i++) {
    criterions.push(
      prisma.ueStarCriterion.create({
        data: {
          name: faker.random.words(),
          descriptionTranslation: {
            create: {
              fr: faker.random.words(),
              en: faker.random.words(),
            },
          },
        },
      }),
    );
  }
  return Promise.all(criterions);
}

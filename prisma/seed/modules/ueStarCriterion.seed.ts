import { RawUEStarCriterion } from '../../../src/prisma/types';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const FAKER_ROUNDS = 5;

export default function ueStarCriterionSeed(prisma: PrismaClient): Promise<RawUEStarCriterion[]> {
  console.log('Seeding UE star criterion...');
  const criterions: Promise<RawUEStarCriterion>[] = [];
  for (let i = 0; i < FAKER_ROUNDS; i++) {
    criterions.push(
      prisma.uEStarCriterion.create({
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

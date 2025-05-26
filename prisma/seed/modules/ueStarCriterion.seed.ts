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
          name: faker.word.words(),
          descriptionTranslation: {
            create: {
              fr: faker.word.words(),
              en: faker.word.words(),
            },
          },
        },
      }),
    );
  }
  return Promise.all(criterions);
}

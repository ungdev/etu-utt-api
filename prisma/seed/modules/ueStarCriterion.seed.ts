import { RawUEStarCriterion } from '../../../src/prisma/types';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export default function ueStarCriterionSeed(prisma: PrismaClient): Promise<RawUEStarCriterion[]> {
  console.log('Seeding UE star criterion...');
  const criteria: Promise<RawUEStarCriterion>[] = [];
  const fakerRounds = 5;
  for (let i = 0; i < fakerRounds; i++) {
    criteria.push(
      prisma.uEStarCriterion.create({
        data: {
          name: faker.random.words(),
          descriptionTranslation: {
            create: {
              fr: faker.random.words(),
            },
          },
        },
      }),
    );
  }
  return Promise.all(criteria);
}

import { RawCreditCategory } from '../../../src/prisma/types';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const FAKER_ROUNDS = 5;

export default function creditCategorySeed(prisma: PrismaClient): Promise<RawCreditCategory[]> {
  console.log('Seeding credit categories...');
  const creditCategories: Promise<RawCreditCategory>[] = [];
  for (let i = 0; i < FAKER_ROUNDS; i++) {
    creditCategories.push(
      prisma.ueCreditCategory.create({
        data: {
          code: faker.string.alpha({ casing: 'upper', length: 2 }),
          name: faker.word.sample(),
        },
      }),
    );
  }
  return Promise.all(creditCategories);
}

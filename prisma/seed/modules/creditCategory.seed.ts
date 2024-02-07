import { RawCreditCategory } from '../../../src/prisma/types';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export default function creditCategorySeed(): Promise<RawCreditCategory[]> {
  console.log('Seeding credit categories...');
  const prisma = new PrismaClient();
  const creditCategories: Promise<RawCreditCategory>[] = [];
  for (let i = 0; i < 5; i++) {
    creditCategories.push(
      prisma.uECreditCategory.create({
        data: {
          code: faker.random.alpha({ casing: 'upper', count: 2 }),
          name: faker.random.word(),
        },
      }),
    );
  }
  return Promise.all(creditCategories);
}

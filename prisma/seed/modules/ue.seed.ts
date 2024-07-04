import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { RawBranchOption, RawCreditCategory, RawSemester, RawUe } from '../../../src/prisma/types';
import { generateTranslation } from '../utils';

const FAKER_ROUNDS = 20;

export default function ueSeed(
  prisma: PrismaClient,
  semesters: RawSemester[],
  branchOptions: RawBranchOption[],
  creditCategory: RawCreditCategory[],
): Promise<RawUe[]> {
  console.log('Seeding ues...');
  const ues: Promise<RawUe>[] = [];
  for (let i = 0; i < FAKER_ROUNDS; i++) {
    const date: Date = faker.date.past();
    const code =
      faker.random.alpha({ casing: 'upper' }) +
      faker.random.alphaNumeric(faker.datatype.number({ min: 2, max: 5 }), { casing: 'upper' });
    ues.push(
      prisma.ue.create({
        data: {
          code,
          inscriptionCode: code.length === 3 ? `${code}X` : code.length === 4 ? code : code.substring(0, 4),
          name: generateTranslation(faker.name.jobTitle),
          validationRate: faker.datatype.number({ min: 0, max: 100 }),
          createdAt: date,
          updatedAt: date,
          info: {
            create: {
              comment: generateTranslation(),
              program: generateTranslation(),
              objectives: generateTranslation(),
              languages: faker.random.word(),
            },
          },
          credits: {
            create: [
              {
                category: {
                  connect: {
                    code: faker.helpers.arrayElement(creditCategory).code,
                  },
                },
                credits: faker.datatype.number({ min: 1, max: 6 }),
              },
            ],
          },
          openSemester: {
            connect: faker.helpers
              .arrayElements(semesters, faker.datatype.number({ min: 1, max: 50 }))
              .map((semester) => ({ code: semester.code })),
          },
          branchOption: {
            connect: faker.helpers
              .arrayElements(branchOptions, faker.datatype.number({ min: 1, max: 3 }))
              .map((branchOption) => ({ id: branchOption.id })),
          },
          workTime: {
            create: {
              cm: faker.datatype.number({ min: 6, max: 32 }),
              td: faker.datatype.number({ min: 6, max: 32 }),
              tp: faker.datatype.number({ min: 6, max: 16 }),
              the: faker.datatype.number({ min: 32, max: 64 }),
              project: faker.datatype.number({ min: 16, max: 48 }),
              internship: 0,
            },
          },
          workTime: { create: {} },
        },
      }),
    );
  }
  return Promise.all(ues);
}

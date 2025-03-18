import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { RawBranchOption, RawCreditCategory, RawSemester, RawUe } from '../../../src/prisma/types';
import { generateTranslation } from '../utils';

const FAKER_ROUNDS = 20;

export const OF_SUFFIX = '_FR_TRO_U23';

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
      faker.string.alpha({ casing: 'upper' }) +
      faker.string.alphanumeric({length: { min: 2, max: 5 }, casing: 'upper'});
    ues.push(
      prisma.ue.create({
        data: {
          code,
          ueofs: {
            create: {
              code: `${code}${OF_SUFFIX}`,
              siepId: faker.number.int({ min: 100000, max: 999999 }),
              name: generateTranslation(faker.person.jobTitle),
              createdAt: date,
              updatedAt: date,
              info: {
                create: {
                  program: generateTranslation(),
                  objectives: generateTranslation(),
                  language: faker.word.sample(),
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
                    credits: faker.number.int({ min: 1, max: 6 }),
                    branchOptions: {
                      connect: faker.helpers
                        .arrayElements(branchOptions, faker.number.int({ min: 1, max: 3 }))
                        .map((branchOption) => ({ code: branchOption.code })),
                    },
                  },
                ],
              },
              openSemester: {
                connect: faker.helpers
                  .arrayElements(semesters, faker.number.int({ min: 1, max: 50 }))
                  .map((semester) => ({ code: semester.code })),
              },
              workTime: {
                create: {
                  cm: faker.number.int({ min: 6, max: 32 }),
                  td: faker.number.int({ min: 6, max: 32 }),
                  tp: faker.number.int({ min: 6, max: 16 }),
                  the: faker.number.int({ min: 32, max: 64 }),
                  project: faker.datatype.boolean(),
                  internship: 0,
                },
              },
            },
          },
        },
      }),
    );
  }
  return Promise.all(ues);
}

import { PrismaClient } from '@prisma/client';
import { RawSemester } from '../../../src/prisma/types';

export async function createSemesters(prisma: PrismaClient) {
  const semesters: Promise<RawSemester>[] = [];
  semesters.push(
    prisma.semester.create({
      data: {
        code: 'P24',
        start: new Date(2024, 1, 19),
        end: new Date(2024, 8, 12),
      },
    }),
  );
  for (let i = 2004; i < 2024; i++) {
    semesters.push(
      prisma.semester.create({
        data: {
          code: `P${i - 2000}`,
          start: new Date(i, 1, 19),
          end: new Date(i, 8, 12),
        },
      }),
    );
    semesters.push(
      prisma.semester.create({
        data: {
          code: `A${i - 2000}`,
          start: new Date(i, 8, 12),
          end: new Date(i + 1, 1, 19),
        },
      }),
    );
  }
  const createdSemesters = await Promise.all(semesters);
  console.log(`Created ${createdSemesters.length} semesters`);
  return createdSemesters;
}

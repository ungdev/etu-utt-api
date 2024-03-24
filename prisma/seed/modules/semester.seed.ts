import { PrismaClient } from '@prisma/client';
import { RawSemester } from '../../../src/prisma/types';

export default function semesterSeed(prisma: PrismaClient): Promise<RawSemester[]> {
  console.log('Seeding semesters...');
  const semesters: Promise<RawSemester>[] = [];
  for (let i = 13; i < 38; i++) {
    semesters.push(
      prisma.semester.create({
        data: {
          code: `P${i}`,
          start: new Date(2000 + i, 1, 20),
          end: new Date(2000 + i, 8, 1),
        },
      }),
    );
    semesters.push(
      prisma.semester.create({
        data: {
          code: `A${i}`,
          start: new Date(2000 + i, 8, 1),
          end: new Date(2001 + i, 1, 20),
        },
      }),
    );
  }
  return Promise.all(semesters);
}

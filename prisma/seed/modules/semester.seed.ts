import { PrismaClient } from '@prisma/client';
import { RawSemester } from "../../../src/prisma/types";

export async function semesterSeed(): Promise<RawSemester[]> {
  console.log('Seeding semesters...');
  const prisma = new PrismaClient();
  const semesters: RawSemester[] = [];
  for (let i = 10; i < 50; i++) {
    semesters.push(
      await prisma.semester.create({
        data: {
          code: `P${i}`,
          start: new Date(2000 + i, 1, 20),
          end: new Date(2000 + i, 8, 1),
        },
      }),
    );
    semesters.push(
      await prisma.semester.create({
        data: {
          code: `A${i}`,
          start: new Date(2000 + i, 8, 1),
          end: new Date(2001 + i, 1, 20),
        },
      }),
    );
  }
  return semesters;
}

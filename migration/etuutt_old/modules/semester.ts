import { RawSemester } from '../../../src/prisma/types';
import { getOperationResults, PrismaClient, PrismaOperationResult } from '../make-migration';

export async function createSemesters(prisma: PrismaClient) {
  const operations: Promise<PrismaOperationResult<RawSemester>>[] = [];
  operations.push(prisma.semester.create({ code: 'P24', start: new Date(2024, 1, 19), end: new Date(2024, 8, 12) }));
  for (let i = 2004; i < 2024; i++) {
    operations.push(
      prisma.semester.create({
        code: `P${i - 2000}`,
        start: new Date(i, 1, 19),
        end: new Date(i, 8, 12),
      }),
    );
    operations.push(
      prisma.semester.create({
        code: `A${i - 2000}`,
        start: new Date(i, 8, 12),
        end: new Date(i + 1, 1, 19),
      }),
    );
  }
  const operationResults = await getOperationResults(operations);
  console.log(
    `Semesters : created ${operationResults.created}, updated ${operationResults.updated}, not changed ${operationResults.notChanged}`,
  );
  return operationResults.data;
}

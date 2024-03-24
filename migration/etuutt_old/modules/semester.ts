import { PrismaClient } from '@prisma/client';

export function createSemesters(prisma: PrismaClient) {
  return prisma.semester.create({ data: { code: 'P24', start: new Date(2024, 1, 19), end: new Date(2024, 8, 12) } });
}

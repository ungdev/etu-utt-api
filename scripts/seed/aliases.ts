import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.info('\x1b[42;30mSeeding UE aliases\x1b[0m');
  await prisma.$transaction([
    prisma.ueAlias.upsert({
      where: { code: 'EC01' },
      update: {},
      create: {
        code: 'EC01',
      },
    }),
    prisma.ueAlias.upsert({
      where: { code: 'MATH03' },
      update: {},
      create: {
        code: 'MATH03',
        standsFor: 'MT03',
      },
    }),
    prisma.ueAlias.upsert({
      where: { code: 'NF05' },
      update: {},
      create: {
        code: 'NF05',
        standsFor: 'NF06',
      },
    }),
  ]);
  console.info('\x1b[42;30m✅ Aliases have been created/updated\x1b[0m');
}

export { main as seedUeAliases };

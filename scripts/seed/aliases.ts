import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.info('\x1b[42;30mSeeding UE aliases\x1b[0m');
  await prisma.ueAlias.deleteMany();
  await prisma.ueAlias.createMany({
    data: [
      {
        code: 'EC01',
      },
      {
        code: 'MATH03',
        standsFor: 'MT03',
      },
      {
        code: 'NF05',
        standsFor: 'NF06',
      },
    ],
  });
  console.info('\x1b[42;30m✅ Aliases have been created\x1b[0m');
}

main();

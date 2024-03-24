import { PrismaClient } from '@prisma/client';

export async function createCreditCategories(prisma: PrismaClient) {
  await prisma.uECreditCategory.createMany({
    data: [
      {
        code: 'CS',
        name: 'Connaissances scientifiques',
      },
      {
        code: 'TM',
        name: 'Techniques et méthodes',
      },
      {
        code: 'EC',
        name: 'Expression et communication',
      },
      {
        code: 'ME',
        name: "Management de l'entreprise",
      },
      {
        code: 'HT',
        name: 'Humanité et technologie',
      },
      {
        code: 'ST',
        name: 'Stage',
      },
    ],
  });
  return prisma.uECreditCategory.findMany();
}

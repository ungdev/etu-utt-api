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
      {
        code: 'HP',
        name: 'Hors profil',
      },
      {
        code: 'MASTER',
        name: 'Master',
      },
      {
        code: 'OTHER',
        name: 'Autre',
      }
    ],
  });
  return prisma.uECreditCategory.findMany();
}

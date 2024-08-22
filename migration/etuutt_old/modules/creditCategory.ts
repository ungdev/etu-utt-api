import { getOperationResults, PrismaClient, PrismaOperationResult } from '../make-migration';
import { RawCreditCategory } from '../../../src/prisma/types';

export async function createCreditCategories(prisma: PrismaClient) {
  const creditCategoriesData = [
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
    },
  ];
  const operations: Promise<PrismaOperationResult<RawCreditCategory>>[] = [];
  for (const creditCategoryData of creditCategoriesData) {
    operations.push(prisma.ueCreditCategory.create(creditCategoryData));
  }
  const results = await getOperationResults(operations);
  console.log(
    `Credit categories : created ${results.created}, updated ${results.updated}, not changed ${results.notChanged}`,
  );
  return results.data;
}

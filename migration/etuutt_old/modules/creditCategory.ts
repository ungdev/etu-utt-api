import { getOperationResults, PrismaClient, PrismaOperationResult } from '../make-migration';
import { RawCreditCategory } from '../../../src/prisma/types';

export async function createCreditCategories(prisma: PrismaClient) {
  const creditCategoriesData = [
    { code: 'CS', name: 'Connaissances scientifiques' },
    { code: 'TM', name: 'Techniques et méthodes' },
    { code: 'ST', name: 'Stage' },
    { code: 'HT', name: 'Humanités et technologies' },
    { code: 'ME', name: 'Mise en situation' },
    { code: 'EC', name: 'Expression et communication' },
    { code: 'AC', name: 'Autres Crédits' },
    { code: 'MA', name: 'Master' },
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

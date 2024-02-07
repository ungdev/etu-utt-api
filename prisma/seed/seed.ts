import { PrismaClient } from '@prisma/client';
import { ueSeed } from './modules/ue.seed';
import { userSeed } from './modules/user.seed';
import { faker } from '@faker-js/faker';
import { semesterSeed } from './modules/semester.seed';
import { branchSeed } from './modules/branch.seed';
import { branchOptionSeed } from './modules/branchOption.seed';
import creditCategorySeed from './modules/creditCategory.seed';
import { cleanDb } from '../../test/utils/test_utils';

const prisma = new PrismaClient();
async function main() {
  console.log('Flushing database...');
  await cleanDb(prisma);
  //Set custom seed
  faker.seed(parseInt(process.env.FAKER_SEED));

  const semesters = await semesterSeed();
  const branches = await branchSeed();
  const branchOptions = await branchOptionSeed(branches);
  const creditCategories = await creditCategorySeed();
  await ueSeed(semesters, branchOptions, creditCategories);
  await userSeed();

  console.log('Seeding done.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

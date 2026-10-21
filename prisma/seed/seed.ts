import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@/prisma/types.js';
import ueSeed from './modules/ue.seed.js';
import { userSeed } from './modules/user.seed.js';
import { faker } from '@faker-js/faker';
import semesterSeed from './modules/semester.seed.js';
import branchSeed from './modules/branch.seed.js';
import branchOptionSeed from './modules/branchOption.seed.js';
import creditCategorySeed from './modules/creditCategory.seed.js';
import { cleanDb } from '#/utils/test_utils.js';
import ueCommentSeed from './modules/ueComment.seed.js';
import ueStarCriterionSeed from './modules/ueStarCriterion.seed.js';
import ueStarVotesSeed from './modules/ueStarVotes.seed.js';
import ueSubscriptionSeed from './modules/ueSubscription.seed.js';
import assoSeed from './modules/asso.seed.js';
import assoMembershipRoleSeed from './modules/assoMembershipRole.seed.js';
import assoMembershipSeed from './modules/assoMembership.seed.js';
import { generateDefaultApplication } from './utils.js';

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL) });
async function main() {
  console.log('Flushing database...');
  await cleanDb(prisma);
  await generateDefaultApplication(prisma);
  //Set custom seed
  faker.seed(parseInt(process.env.FAKER_SEED));

  const semesters = await semesterSeed(prisma);
  const branches = await branchSeed(prisma);
  const branchOptions = await branchOptionSeed(prisma, branches);
  const creditCategories = await creditCategorySeed(prisma);
  const ues = await ueSeed(prisma, semesters, branchOptions, creditCategories);
  const users = await userSeed(prisma);
  const ueSubscriptions = await ueSubscriptionSeed(prisma, users, ues, semesters);
  await ueCommentSeed(prisma, users, semesters, ueSubscriptions);
  const ueStarCriterions = await ueStarCriterionSeed(prisma);
  await ueStarVotesSeed(prisma, ueStarCriterions, ueSubscriptions);
  const assos = await assoSeed(prisma);
  const roles = await assoMembershipRoleSeed(prisma, assos);
  await assoMembershipSeed(prisma, users, assos, roles);

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

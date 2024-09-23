import { PrismaClient } from '@prisma/client';
import ueSeed from './modules/ue.seed';
import { userSeed } from './modules/user.seed';
import { faker } from '@faker-js/faker';
import semesterSeed from './modules/semester.seed';
import branchSeed from './modules/branch.seed';
import branchOptionSeed from './modules/branchOption.seed';
import creditCategorySeed from './modules/creditCategory.seed';
import { cleanDb } from '../../test/utils/test_utils';
import ueCommentSeed from './modules/ueComment.seed';
import ueStarCriterionSeed from './modules/ueStarCriterion.seed';
import ueStarVotesSeed from './modules/ueStarVotes.seed';
import ueSubscriptionSeed from './modules/ueSubscription.seed';
import assoSeed from './modules/asso.seed';
import assoMembershipRoleSeed from './modules/assoMembershipRole.seed';
import assoMembershipSeed from './modules/assoMembership.seed';

const prisma = new PrismaClient();
async function main() {
  console.log('Flushing database...');
  await cleanDb(prisma);
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

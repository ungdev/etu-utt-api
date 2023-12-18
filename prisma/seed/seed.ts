import { PrismaClient } from '@prisma/client';
import { ueSeed } from './modules/ue/ue.seed';
import { userSeed } from './modules/user/user.seed';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();
async function main() {
  //Set custom seed
  faker.seed(parseInt(process.env.FAKER_SEED));
  console.log('Seeding...');

  await ueSeed();
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

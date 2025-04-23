import { RawSemester, RawUe, RawUser, RawUserUeSubscription } from '../../../src/prisma/types';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { OF_SUFFIX } from './ue.seed';

export default function ueSubscriptionSeed(
  prisma: PrismaClient,
  users: RawUser[],
  ues: RawUe[],
  semesters: RawSemester[],
): Promise<RawUserUeSubscription[]> {
  console.log('Seeding UE subscriptions...');
  const subscriptions: Promise<RawUserUeSubscription>[] = [];
  /*for (const user of users) {
    const subscribedToUes = faker.helpers.arrayElements(ues, faker.datatype.number({ min: 1, max: 10 }));
    for (const ue of subscribedToUes) {
      subscriptions.push(
        prisma.userUeSubscription.create({
          data: {
            ueof: { connect: { code: `${ue.code}$${OF_SUFFIX}` } },
            user: { connect: { id: user.id } },
            semester: { connect: { code: faker.helpers.arrayElement(semesters).code } },
          },
        }),
      );
    }
  }*/
  console.log('WARNING: no ue subscriptions seeded !!');
  return Promise.all(subscriptions);
}

import { RawSemester, RawUE, RawUser, RawUserUESubscription } from '../../../src/prisma/types';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export default function ueSubscriptionSeed(
  prisma: PrismaClient,
  users: RawUser[],
  ues: RawUE[],
  semesters: RawSemester[],
): Promise<RawUserUESubscription[]> {
  console.log('Seeding UE subscriptions...');
  const subscriptions: Promise<RawUserUESubscription>[] = [];
  for (const user of users) {
    const subscribedToUEs = faker.helpers.arrayElements(ues, faker.datatype.number({ min: 1, max: 10 }));
    for (const ue of subscribedToUEs) {
      subscriptions.push(
        prisma.userUESubscription.create({
          data: {
            ue: { connect: { id: ue.id } },
            user: { connect: { id: user.id } },
            semester: { connect: { code: faker.helpers.arrayElement(semesters).code } },
          },
        }),
      );
    }
  }
  return Promise.all(subscriptions);
}

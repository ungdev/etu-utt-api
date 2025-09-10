import { RawUeStarVote, RawUeStarCriterion, RawUserUeSubscription } from '../../../src/prisma/types';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export default function ueStarVotesSeed(
  prisma: PrismaClient,
  criteria: RawUeStarCriterion[],
  ueSubscriptions: RawUserUeSubscription[],
): Promise<RawUeStarVote[]> {
  console.log('Seeding UE comments...');
  const votes: Promise<RawUeStarVote>[] = [];
  for (const subscription of ueSubscriptions) {
    if (faker.datatype.boolean()) continue;
    const criteriaVoted = faker.helpers.arrayElements(criteria);
    for (const criterion of criteriaVoted) {
      votes.push(
        prisma.ueStarVote.create({
          data: {
            user: { connect: { id: subscription.userId } },
            ueof: { connect: { code: subscription.ueofCode } },
            criterion: { connect: { id: criterion.id } },
            value: faker.number.int({ min: 1, max: 5 }),
          },
        }),
      );
    }
  }
  return Promise.all(votes);
}

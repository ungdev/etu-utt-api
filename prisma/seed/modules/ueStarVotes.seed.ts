import { RawUEStarVote, RawUEStarCriterion, RawUserUESubscription } from '../../../src/prisma/types';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export default function ueStarVotesSeed(
  prisma: PrismaClient,
  criteria: RawUEStarCriterion[],
  ueSubscriptions: RawUserUESubscription[],
): Promise<RawUEStarVote[]> {
  console.log('Seeding UE comments...');
  const votes: Promise<RawUEStarVote>[] = [];
  for (const subscription of ueSubscriptions) {
    if (faker.datatype.boolean()) continue;
    const criteriaVoted = faker.helpers.arrayElements(criteria);
    for (const criterion of criteriaVoted) {
      votes.push(
        prisma.uEStarVote.create({
          data: {
            user: { connect: { id: subscription.userId } },
            ue: { connect: { id: subscription.ueId } },
            criterion: { connect: { id: criterion.id } },
            value: faker.datatype.number({ min: 1, max: 5 }),
          },
        }),
      );
    }
  }
  return Promise.all(votes);
}

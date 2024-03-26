import { RawUEStarVote, RawUE, RawUEStarCriterion, RawUser } from '../../../src/prisma/types';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export default function ueStarVotesSeed(
  prisma: PrismaClient,
  users: RawUser[],
  ues: RawUE[],
  criterions: RawUEStarCriterion[],
): Promise<RawUEStarVote[]> {
  console.log('Seeding UE comments...');
  const votes: Promise<RawUEStarVote>[] = [];
  for (const user of users) {
    // Some will not vote at all
    if (faker.datatype.boolean()) continue;
    const votedForUEs = faker.helpers.arrayElements(ues, faker.datatype.number(10));
    for (const ue of votedForUEs) {
      const votedWithCriterions = faker.helpers.arrayElements(
        criterions,
        faker.datatype.number({
          min: 1,
          max: criterions.length,
        }),
      );
      for (const criterion of votedWithCriterions) {
        votes.push(
          prisma.uEStarVote.create({
            data: {
              value: faker.datatype.number({ min: 1, max: 5 }),
              criterion: { connect: { id: criterion.id } },
              user: { connect: { id: user.id } },
              ue: { connect: { id: ue.id } },
            },
          }),
        );
      }
    }
  }
  return Promise.all(votes);
}

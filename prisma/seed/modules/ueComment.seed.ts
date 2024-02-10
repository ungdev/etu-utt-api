import { RawSemester, RawUE, RawUEComment, RawUser } from '../../../src/prisma/types';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export default function ueCommentSeed(
  prisma: PrismaClient,
  users: RawUser[],
  ues: RawUE[],
  semester: RawSemester[],
): Promise<RawUEComment[]> {
  console.log('Seeding UE comments...');
  const comments: Promise<RawUEComment>[] = [];
  const fakerRounds = 100;
  const ueAuthorPairs: Array<{ ue: string; author: string }> = [];
  for (let i = 0; i < fakerRounds; i++) {
    const date: Date = faker.date.past();
    const anonymous = faker.datatype.boolean();
    let ueAuthorPair: { ue: string; author: string } | null = null;
    while (
      ueAuthorPair === null ||
      ueAuthorPairs.some(({ ue, author }) => ue === ueAuthorPair.ue && author === ueAuthorPair.author)
    ) {
      ueAuthorPair = {
        ue: faker.helpers.arrayElement(ues).code,
        author: faker.helpers.arrayElement(users).id,
      };
    }
    ueAuthorPairs.push(ueAuthorPair);
    comments.push(
      prisma.uEComment.create({
        data: {
          isAnonymous: anonymous,
          author: {
            connect: {
              id: ueAuthorPair.author,
            },
          },
          ue: {
            connect: {
              code: ueAuthorPair.ue,
            },
          },
          semester: {
            connect: {
              code: faker.helpers.arrayElement(semester).code,
            },
          },
          body: faker.lorem.paragraph(),
          createdAt: date,
          updatedAt: date,
        },
      }),
    );
  }
  return Promise.all(comments);
}

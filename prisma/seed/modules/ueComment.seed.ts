import { RawSemester, RawUE, RawUEComment, RawUser } from '../../../src/prisma/types';
import { Prisma, PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const FAKER_ROUNDS = 100;

export default function ueCommentSeed(
  prisma: PrismaClient,
  users: RawUser[],
  ues: RawUE[],
  semester: RawSemester[],
): Promise<RawUEComment[]> {
  console.log('Seeding UE comments...');
  const comments: Promise<RawUEComment>[] = [];
  const ueAuthorPairs: Array<{ ue: string; author: string }> = [];
  for (let i = 0; i < FAKER_ROUNDS; i++) {
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
    const answers: Prisma.UECommentReplyCreateWithoutCommentInput[] = new Array(faker.datatype.number(4))
      .fill(undefined)
      .map(() => {
        const answerDate = faker.date.soon(10, date);
        return {
          body: faker.lorem.paragraph(),
          authorId: faker.helpers.arrayElement(users).id,
          createdAt: answerDate,
          updatedAt: faker.date.soon(10, answerDate),
        };
      });
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
          updatedAt: faker.datatype.boolean() ? faker.date.soon(10, date) : undefined,
          answers: {
            createMany: {
              data: answers,
            },
          },
        },
      }),
    );
  }
  return Promise.all(comments);
}

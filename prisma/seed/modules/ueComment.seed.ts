import { RawSemester, RawUeComment, RawUser, RawUserUeSubscription } from '../../../src/prisma/types';
import { Prisma, PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const FAKER_ROUNDS = 100;

export default function ueCommentSeed(
  prisma: PrismaClient,
  users: RawUser[],
  semester: RawSemester[],
  ueSubscriptions: RawUserUeSubscription[],
): Promise<RawUeComment[]> {
  console.log('Seeding UE comments...');
  const comments: Promise<RawUeComment>[] = [];

  const ueSubscriptionsThatEndedInAComment = faker.helpers.arrayElements(ueSubscriptions, FAKER_ROUNDS);
  for (const subscription of ueSubscriptionsThatEndedInAComment) {
    const date: Date = faker.date.past();
    const anonymous = faker.datatype.boolean();
    const answers: Prisma.UeCommentReplyCreateWithoutCommentInput[] = new Array(faker.datatype.number(4))
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
      prisma.ueComment.create({
        data: {
          isAnonymous: anonymous,
          author: {
            connect: {
              id: subscription.userId,
            },
          },
          ueof: {
            connect: {
              code: subscription.ueofId,
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

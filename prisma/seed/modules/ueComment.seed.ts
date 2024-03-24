import { RawSemester, RawUE, RawUEComment, RawUser, RawUserUESubscription } from '../../../src/prisma/types';
import { Prisma, PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export default function ueCommentSeed(
  prisma: PrismaClient,
  users: RawUser[],
  ues: RawUE[],
  semester: RawSemester[],
  ueSubscriptions: RawUserUESubscription[],
): Promise<RawUEComment[]> {
  console.log('Seeding UE comments...');
  const comments: Promise<RawUEComment>[] = [];
  const fakerRounds = 100;

  const ueSubscriptionsThatEndedInAComment = faker.helpers.arrayElements(ueSubscriptions, fakerRounds);
  for (const subscription of ueSubscriptionsThatEndedInAComment) {
    const date: Date = faker.date.past();
    const anonymous = faker.datatype.boolean();
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
              id: subscription.userId,
            },
          },
          ue: {
            connect: {
              id: subscription.ueId,
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

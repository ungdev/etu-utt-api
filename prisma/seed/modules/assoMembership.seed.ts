import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { AssosOverView } from 'src/assos/interfaces/assos-overview.interface';
import { RawUser } from 'src/prisma/types';

export default function assoMembershipSeed(prisma: PrismaClient, users: RawUser[], assos: AssosOverView[], roles) {
  console.log('Seeding assoMemberships...');
  const assoMemberships = [];
  const fakerRounds = 10;
  for (let i = 0; i < fakerRounds; i++) {
    const date: Date = faker.date.past();
    assoMemberships.push(
      prisma.assoMembership.create({
        data: {
          startAt: date,
          endAt: faker.date.future(),
          createdAt: date,
          user: {
            connect: {
              id: users[i].id,
            },
          },
          asso: {
            connect: {
              id: assos[i].id,
            },
          },
          role: {
            connect: {
              id: roles[i].id,
            },
          },
        },
      }),
    );
  }
  return Promise.all(assoMemberships);
}

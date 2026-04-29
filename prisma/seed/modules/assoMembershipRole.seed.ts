import { faker } from '@faker-js/faker';
import { Asso } from '../../../src/assos/interfaces/asso.interface';
import { PrismaClient, RawAssoMembershipRole } from '../../../src/prisma/types';

export default function assoMembershipRoleSeed(prisma: PrismaClient, assos: Asso[]): Promise<RawAssoMembershipRole[]> {
  console.log('Seeding assoMembershipRoles');
  const roles = [];
  const presidentNames = ['Président', 'CEO', 'PDG'];
  const fakerRounds = 10;
  for (const asso of assos) {
    for (let i = 0; i < fakerRounds; i++) {
      roles.push(
        prisma.assoMembershipRole.create({
          data: {
            name: faker.helpers.arrayElement(presidentNames),
            position: 1,
            isPresident: i == 0,
            asso: {
              connect: {
                id: asso.id,
              },
            },
          },
        }),
      );
    }
  }
  return Promise.all(roles);
}

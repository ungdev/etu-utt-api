import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

export default function assoMembershipRoleSeed(prisma: PrismaClient) {
  console.log('Seeding assoMembershipRoles');
  const roles = [];
  const presidentNames = ['Président', 'CEO', 'PDG'];
  const fakerRounds = 10;
  for (let i = 0; i < fakerRounds; i++) {
    roles.push(
      prisma.assoMembershipRole.create({
        data: {
          name: faker.helpers.arrayElement(presidentNames),
          position: 1,
          isPresident: true,
        },
      }),
    );
  }
  return Promise.all(roles);
}

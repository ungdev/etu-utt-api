import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

export default function assoSeed(prisma: PrismaClient) {
  console.log('Seeding assos...');
  const assos = [];
  const fakerRounds = 10;
  for (let i = 0; i < fakerRounds; i++) {
    const date: Date = faker.date.past();
    assos.push(
      prisma.asso.create({
        data: {
          login: faker.random.word(),
          name: faker.company.name(),
          mail: faker.internet.email(),
          phoneNumber: faker.phone.number(),
          website: faker.internet.domainName(),
          logo: faker.image.business(),
          createdAt: date,
          updatedAt: date,
          descriptionShortTranslation: {
            create: {
              fr: faker.lorem.sentence(),
              en: faker.lorem.sentence(),
            },
          },
          descriptionTranslation: {
            create: {
              fr: faker.lorem.paragraph(),
              en: faker.lorem.paragraph(),
            },
          },
        },
      }),
    );
  }
  return Promise.all(assos);
}

import { faker } from '@faker-js/faker';
import { PrismaClient, UserType } from '../../../src/prisma/types';

export default function assoSeed(prisma: PrismaClient) {
  console.log('Seeding assos...');
  const assos = [];
  const fakerRounds = 10;
  for (let i = 0; i < fakerRounds; i++) {
    const date: Date = faker.date.past();
    const name = faker.company.name();
    assos.push(
      prisma.asso.create({
        data: {
          name,
          mail: faker.internet.email(),
          phoneNumber: faker.phone.number(),
          website: faker.internet.domainName(),
          logo: {
            create: {
              height: 100,
              width: 100,
              size: 1024,
              isPublic: true,
              preset: 'AVATAR',
              uploader: {
                create: {
                  login: name,
                  firstName: '',
                  lastName: '',
                  userType: UserType.ASSOCIATION,
                  socialNetwork: { create: {} },
                  mailsPhones: { create: {} },
                  rgpd: { create: {} },
                  preference: { create: {} },
                  infos: { create: {} },
                  privacy: { create: {} },
                },
              },
            },
          },
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
          assoAccount: {
            create: {
              login: name,
              firstName: '',
              lastName: '',
              userType: UserType.ASSOCIATION,
              socialNetwork: { create: {} },
              mailsPhones: { create: {} },
              rgpd: { create: {} },
              preference: { create: {} },
              infos: { create: {} },
              privacy: { create: {} },
            },
          },
        },
      }),
    );
  }
  return Promise.all(assos);
}

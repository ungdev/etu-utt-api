import { Translation } from '@prisma/client';
import { faker } from '@faker-js/faker';

export function fakeTranslation(id): Translation {
  return {
    //TODO: To improve later
    id: id,
    fr: faker.lorem.paragraph(),
    en: faker.lorem.paragraph(),
    es: faker.lorem.paragraph(),
    de: faker.lorem.paragraph(),
    zh: faker.lorem.paragraph(),
  };
}

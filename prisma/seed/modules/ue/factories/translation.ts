/*
export type Translation = {
  id: string
  french: string | null
  english: string | null
  spanish: string | null
  german: string | null
  chinese: string | null
}*/

import {Translation} from "@prisma/client";
import {faker} from "@faker-js/faker";

export function fakeTranslation(id): Translation {
    return {
        //TODO: To improve later
        id: id,
        french: faker.lorem.paragraph(),
        english: faker.lorem.paragraph(),
        spanish: faker.lorem.paragraph(),
        german: faker.lorem.paragraph(),
        chinese: faker.lorem.paragraph()
    };
}
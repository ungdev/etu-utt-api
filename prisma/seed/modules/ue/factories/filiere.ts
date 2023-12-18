import { UTTFiliere } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { branchesCode } from '../../../const';

export function fakeUTTFiliere(code, translationId): UTTFiliere {
  return {
    code: code,
    name: faker.name.jobTitle(),
    brancheId: faker.helpers.arrayElement(branchesCode),
    descriptionTranslationId: translationId,
  };
}

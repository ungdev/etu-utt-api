import { UTTBranchOption } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { branchesCode } from '../../../const';

export function fakeUTTBranchOption(code, translationId): UTTBranchOption {
  return {
    code: code,
    name: faker.name.jobTitle(),
    branchId: faker.helpers.arrayElement(branchesCode),
    descriptionTranslationId: translationId,
  };
}

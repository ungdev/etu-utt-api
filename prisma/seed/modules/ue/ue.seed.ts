import { PrismaClient } from '@prisma/client';
import { fakeUE } from './factories';
import {
  branchesCode,
  branchOptionsCode,
  translationsUuids,
} from '../../const';
import { fakeUTTBranchOption } from './factories/filiere';
import { fakeUttBranch } from './factories/branche';
import { fakeTranslation } from './factories/translation';
import { faker } from '@faker-js/faker';

export async function ueSeed() {
  const prisma = new PrismaClient();
  console.log('Seeding ues...');
  const fakerRounds = 20;
  //In order to create UTTBranches we need to create some Translation for the description of each Branche
  for (const translationsUuid of translationsUuids) {
    await prisma.translation.create({
      data: fakeTranslation(translationsUuid),
    });
  }
  //In order to create UTTFilieres we need to create UTTBranches
  let notUsedTranslationsUuids = [...translationsUuids];
  for (const code of branchesCode) {
    const uuid = faker.helpers.arrayElement(notUsedTranslationsUuids);
    notUsedTranslationsUuids.slice(notUsedTranslationsUuids.indexOf(uuid), 1);
    await prisma.uTTBranch.create({
      data: fakeUttBranch(code, uuid),
    });
  }
  //In order to create UE we need to create first UTTFiliere
  notUsedTranslationsUuids = [...translationsUuids];
  for (const filiere of branchOptionsCode) {
    const uuid = faker.helpers.arrayElement(notUsedTranslationsUuids);
    notUsedTranslationsUuids.slice(notUsedTranslationsUuids.indexOf(uuid), 1);
    await prisma.uTTBranchOption.create({
      data: fakeUTTBranchOption(filiere, uuid),
    });
  }
  for (let i = 0; i < fakerRounds; i++) {
    await prisma.uE.create({ data: fakeUE() });
  }
  console.log('Seeding done.');
}

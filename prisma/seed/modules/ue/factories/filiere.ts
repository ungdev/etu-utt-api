/*
model UTTFiliere {
  code                     String @id @db.VarChar(10)
  name                     String @db.VarChar(255)
  brancheId                String
  descriptionTranslationId String

  branche                UTTBranche    @relation(fields: [brancheId], references: [code])
  descriptionTranslation Translation   @relation(fields: [descriptionTranslationId], references: [id])
  UEs                    UE[]
  userBranches           UserBranche[]
}
 */
import {UTTFiliere} from "@prisma/client";
import {faker} from "@faker-js/faker";
import {branchesCode} from "../../../const";

export function fakeUTTFiliere(code, translationId): UTTFiliere {
    return {
        code: code,
        name: faker.name.jobTitle(),
        brancheId: faker.helpers.arrayElement(branchesCode),
        descriptionTranslationId: translationId
    };
}
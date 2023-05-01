import { PrismaClient } from '@prisma/client'
import {fakeUE} from "./factories";
import {branchesCode, filieresCode, translationsUuids} from "../../const";
import {fakeUTTFiliere} from "./factories/filiere";
import {fakeUttBranche} from "./factories/branche";
import {fakeTranslation} from "./factories/translation";
import {faker} from "@faker-js/faker";

export async function ueSeed() {
    const prisma = new PrismaClient()
    console.log("Seeding ues...")
    const fakerRounds = 20;
    //In order to create UTTBranches we need to create some Translation for the description of each Branche
    for (let translationsUuid of translationsUuids) {
        await prisma.translation.create({data: fakeTranslation(translationsUuid)});
    }
    //In order to create UTTFilieres we need to create UTTBranches
    for (let code of branchesCode) {
        await prisma.uTTBranche.create({data: fakeUttBranche(code, faker.helpers.arrayElement(translationsUuids))});
    }
    //In order to create UE we need to create first UTTFiliere
    for (let filiere of filieresCode) {
        await prisma.uTTFiliere.create({data: fakeUTTFiliere(filiere, faker.helpers.arrayElement(translationsUuids))});
    }
    for (let i = 0; i < fakerRounds; i++) {
        await prisma.uE.create({data: fakeUE()});
    }
    console.log("Seeding done.")
}


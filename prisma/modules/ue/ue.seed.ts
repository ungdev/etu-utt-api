import { PrismaClient } from '@prisma/client'
import {fakeUE} from "./models";

export async function ueSeed() {
    const prisma = new PrismaClient()
    console.log("Seeding ues...")
    const fakerRounds = 20;
    for (let i = 0; i < fakerRounds; i++) {
        await prisma.uE.create({data: fakeUE()});
    }
    console.log("Seeding done.")
}


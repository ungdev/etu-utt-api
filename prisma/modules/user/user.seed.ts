import { PrismaClient } from '@prisma/client'
import {fakeUser} from "./models";

export async function userSeed() {
    const prisma = new PrismaClient()
    console.log("Seeding users...")
    const fakerRounds = 100;
    for (let i = 0; i < fakerRounds; i++) {
        await prisma.user.create({data: fakeUser()});
    }
    console.log("Seeding done.")
}


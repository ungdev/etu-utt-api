import { PrismaClient } from '@prisma/client'
import {fakeUser} from "./faked-models";

const prisma = new PrismaClient()
async function main() {
    console.log("Seeding...")
    const fakerRounds = 100;
    for (let i = 0; i < fakerRounds; i++) {
        await prisma.user.create({ data: fakeUser() });
    }
    console.log("Seeding done.")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
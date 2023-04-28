import { PrismaClient } from '@prisma/client'
import {ueSeed} from "./modules/ue/ue.seed";
import {userSeed} from "./modules/user/user.seed";

const prisma = new PrismaClient()
async function main() {
    const seedsFunction = [
        ueSeed, userSeed
    ]
    console.log("Seeding...")
    for (let seedFunction of seedsFunction) {
        await seedFunction()
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
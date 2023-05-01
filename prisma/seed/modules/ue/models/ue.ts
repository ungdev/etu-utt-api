import {UE} from "@prisma/client";
import {faker} from "@faker-js/faker";
import {baseUesCode, filieresCode} from "../../../const";



//Je mets le code en paramètre puisque pour moi c'est à la logique du seeder de le générer
export function fakeUE(): UE {
    const date: Date = faker.date.past()
    return {
        id: faker.datatype.uuid(),
        //Valeurs purement arbitraire, si vous souhaitez changer hésitez pas
        code: faker.helpers.arrayElement(baseUesCode) + faker.datatype.number({min: 1, max: 13}),
        name: faker.name.jobTitle(),
        validationRate: faker.datatype.number({min: 0, max: 100}),
        createdAt: date,
        updatedAt: date,
        filiereId: faker.helpers.arrayElement(filieresCode)
    };
}
import { PrismaService } from '../../src/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { ConfigModule } from '../../src/config/config.module';
import { DMMF } from '@prisma/client/runtime/library';
import { clearUniqueValues } from '../../prisma/seed/utils';
import { PrismaClient, UserType } from '@prisma/client';

/**
 * Initializes this file.
 * Sets the seed for faker. This is useful to have deterministic tests.
 * @param app The app from which to get the {@link ConfigModule}.
 */
export function init(app: AppProvider) {
  faker.seed(app().get(ConfigModule).FAKER_SEED);
}

/**
 * A function returning the app, for e2e testing ({@link INestApplication}).
 */
export type E2EAppProvider = () => INestApplication;
/**
 * A function returning the app, for e2e testing ({@link TestingModule}).
 */
export type UnitAppProvider = () => TestingModule;
/**
 * A function returning the app, either for e2e or unit testing.
 */
export type AppProvider = E2EAppProvider | UnitAppProvider;

/**
 * Creates a suite. It works the same as {@link describe}, but it cleans the database before each suite.
 * @param name The name of the suite. It will be displayed in the test logs.
 * @param func The function containing the tests.
 *
 * @example
 * const DummyE2ETesting = e2eSuite('Dummy E2E testing (e2e)', (app) => {
 *   const user = createUser(app);
 *   it('should have created a user', async () => expect(user.id).not.toBeUndefined());
 * });
 */
function suite<T extends AppProvider>(name: string, func: (app: T) => void) {
  return (app: T) =>
    describe(name, () => {
      beforeAll(async () => {
        await cleanDb(app().get(PrismaService));
        await app()
          .get(PrismaService)
          .user.create({
            data: {
              login: 'etuutt',
              firstName: 'Etu',
              lastName: 'UTT',
              userType: UserType.STUDENT,
              apiApplications: {
                create: {
                  id: DEFAULT_APPLICATION,
                  name: faker.company.name(),
                },
              },
              socialNetwork: { create: {} },
              rgpd: { create: {} },
              preference: { create: {} },
              infos: { create: {} },
              mailsPhones: { create: {} },
              privacy: { create: {} },
            },
          });
        clearUniqueValues();
      });
      func(app);
    });
}

/**
 * Creates a suite for e2e testing. It works the same as {@link describe}, but it cleans the database before each suite.
 * {@see suite}
 */
export const e2eSuite = suite<E2EAppProvider>;

/**
 * Creates a suite for unit testing. It works the same as {@link describe}, but it cleans the database before each suite.
 * {@see suite}
 */
export const unitSuite = suite<UnitAppProvider>;

/** Utilities to use in {@link Spec.expectJsonLike} to match database-generated values */
export const JsonLike = {
  STRING: "typeof $V === 'string'",
  ANY_UUID: /[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}/,
  ANY_DATE: /\d{4}-\d{2}-\d{2}T(\d{2}:){2}\d{2}.\d{3}Z/,
};

export const Dummies = {
  UUID: '00000000-0000-4000-8000-000000000000',
};

/**
 * Clears entirely the database.
 * @param prisma The prisma service instance.
 */
export async function cleanDb(prisma: PrismaService | PrismaClient) {
  // We can't delete each table one by one, because of foreign key constraints
  const tablesCleared = [] as string[];
  // _runtimeDataModel.models basically contains a JS-ified version of the schema.prisma
  for (const modelName of Object.keys((prisma as any)._runtimeDataModel.models) as string[]) {
    // Check the table hasn't been already cleaned
    if (tablesCleared.includes(modelName)) continue;
    await clearTableWithCascade(prisma, modelName, tablesCleared);
  }
}

/**
 * Clears a table, and all the tables that have a foreign key constraint on it.
 * This should only be used by {@link cleanDb}.
 * @param prisma The prisma service instance.
 * @param modelName The name of the model to clear.
 * @param tablesCleared The list of tables that have already been cleared.
 */
async function clearTableWithCascade(prisma: PrismaService | PrismaClient, modelName: string, tablesCleared: string[]) {
  // No, the full type of the model is not even exported :(
  // (type RuntimeDataModel in prisma/client/runtime/library)
  const model: Omit<DMMF.Model, 'name'> = (prisma as any)._runtimeDataModel.models[modelName];
  for (const field of Object.values(model.fields)) {
    // First, check that the field is a relation, and not a normal String, or Int, or any normal SQL type
    // We then check that this is not a self-referencing relation, to avoid infinite loops
    // The way we verify that this is not the part of the relation that is referenced is by checking the length of relationFromFields : if it has a length, the table contains the FK, if not, that's the other table
    // Plot twist : Prisma allows for ManyToMany relations. That means that, to avoid infinitely looping, we verify the other relation in the opposite direction (with the same name) holds the FK
    if (
      field.kind === 'object' &&
      field.type !== modelName &&
      field.relationFromFields.length === 0 &&
      !tablesCleared.includes(field.type) &&
      (prisma as any)._runtimeDataModel.models[field.type].fields.find(
        (f: DMMF.Field) => f.relationName === field.relationName,
      ).relationFromFields.length !== 0
    ) {
      // After all these checks, simply delete rows from the other table first to avoid foreign key constraint errors
      await clearTableWithCascade(prisma, field.type, tablesCleared);
    }
  }
  // And finally, once it's safe to do it, delete the rows, and mark it as cleared
  await prisma[modelName].deleteMany();
  tablesCleared.push(modelName);
}

export const DEFAULT_APPLICATION = '52ce644d-183f-49e9-bd21-d2d4f37e2196';

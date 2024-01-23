import { PrismaService } from '../../src/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';

faker.seed(69);

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
        await app().get(PrismaService).cleanDb();
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

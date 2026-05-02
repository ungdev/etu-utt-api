import { PrismaService } from '../../src/prisma/prisma.service';
import { PrismaClient } from '../../src/prisma/types';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { ConfigService } from '../../src/config/config.service';
import { clearUniqueValues, generateDefaultApplication } from '../../prisma/seed/utils';
import Spec from 'pactum/src/models/Spec';
import { AppModule } from '../../src/app.module';
import * as pactum from 'pactum';

export async function buildTestApp(port: number): Promise<E2EApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.register()],
  }).compile();
  const nestApp = moduleRef.createNestApplication();
  AppModule.initApp(nestApp);
  await nestApp.listen(port);

  nestApp['spec'] = () => pactum.spec().withBaseUrl(
    `http://localhost:${port}${process.env.API_PREFIX.startsWith('/') ? '' : '/'}${process.env.API_PREFIX.endsWith('/') ? process.env.API_PREFIX.slice(0, -1) : process.env.API_PREFIX}`,
  );
  return nestApp as unknown as E2EApp;
}

/**
 * Initializes this file.
 * Sets the seed for faker. This is useful to have deterministic tests.
 * @param app The app from which to get the {@link ConfigService}.
 */
export function init(app: AppProvider) {
  faker.seed(app().get(ConfigService).FAKER_SEED);
}

/**
 * Extended INestApplication, with utility function spec() which sets up a {@link Spec} object for calling a route of the app.
 */
export type E2EApp = INestApplication & { spec(): Spec }

/**
 * A function returning the app, for e2e testing ({@link INestApplication}).
 */
export type E2EAppProvider = () => E2EApp;
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
        const prisma = app().get(PrismaService);
        await cleanDb(prisma);
        clearUniqueValues();
        await generateDefaultApplication(prisma);
      }, 15000);
      func(app);
    });
}
suite.skip =
  <T extends AppProvider>(name: string, func: (app: T) => void) =>
  (app: T) =>
    describe.skip(name, () => {
      func(app);
    });

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

/** Utilities to use in {@link Spec.$expectJsonRegexable} to match database-generated values */
export const JsonLike = {
  STRING: Symbol('string'),
  UUID: Symbol('uuid'),
  INT: Symbol('int'),
  DATE: /^\d{4}-[01]\d-[0-3]\d(?:T[0-2]\d:[0-5]\d:[0-5]\d[.,]\d+Z)?$/, // dateTime from pactum-matchers doesn't ms
};

export const Dummies = {
  UUID: '00000000-0000-4000-8000-000000000000',
};

/**
 * Clears entirely the database.
 * @param prisma The prisma service instance.
 */
export async function cleanDb(prisma: PrismaService | PrismaClient) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`);
    // _runtimeDataModel.models basically contains a JS-ified version of the schema.prisma
    for (const modelName of Object.keys((tx as any)._runtimeDataModel.models) as string[])
      await tx[modelName].deleteMany();
    await tx.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);
  });
}

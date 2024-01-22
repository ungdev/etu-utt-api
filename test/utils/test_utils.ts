import { PrismaService } from '../../src/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';

faker.seed(69);

export type E2EAppProvider = () => INestApplication;
export type UnitAppProvider = () => TestingModule;
export type AppProvider = E2EAppProvider | UnitAppProvider;

export function e2eSuite(name: string, func: (app: E2EAppProvider) => void) {
  return (app: E2EAppProvider) =>
    describe(name, () => {
      beforeAll(async () => {
        await app().get(PrismaService).cleanDb();
      });
      func(app);
    });
}

export function unitSuite(name: string, func: (app: UnitAppProvider) => void) {
  return (app: UnitAppProvider) =>
    describe(name, () => {
      beforeAll(async () => {
        await app().get(PrismaService).cleanDb();
      });
      func(app);
    });
}

/** Utilities to use in {@link Spec.expectJsonLike} to match database-generated values */
export const JsonLike = {
  STRING: "typeof $V === 'string'",
  ANY_UUID: /[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}/,
  ANY_DATE: /\d{4}-\d{2}-\d{2}T(\d{2}:){2}\d{2}.\d{3}Z/,
};

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'prisma/config';

const isTestEnv = process.env.NODE_ENV === 'test';
const envFile = isTestEnv ? '.env.test' : '.env.dev';
let databaseURL: string | undefined;
try {
  readFileSync(join(process.cwd(), envFile), 'utf-8')
    .split('\n')
    .find((line) => line.includes('DATABASE_URL='))
    ?.replace(/DATABASE_URL="?(\S+?)"?$/, '$1');
} catch {}

export default defineConfig({
  schema: join('prisma'),
  migrations: {
    path: join('prisma', 'migrations'),
  },
  engine: 'classic',
  datasource: {
    url: process.env.DATABASE_URL || (process.env.DATABASE_URL = databaseURL),
  },
});

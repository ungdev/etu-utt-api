import { PrismaClient } from '@prisma/client';
import { createConnection } from 'mysql';
import { migrateUsers } from './modules/user';
import { cleanDb } from '../../test/utils/test_utils';
import { migrateUEs } from './modules/ue';
import { createCreditCategories } from './modules/creditCategory';
import { createSemesters } from './modules/semester';

const prisma = new PrismaClient();

const connection = createConnection({
  host: 'localhost',
  user: 'dev',
  password: 'dev',
  database: 'etuutt_old',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database');
    return;
  }
  console.log('Connected to database');
  main().then(() => {
    prisma.$disconnect();
    connection.end();
  });
});

export type QueryFunction = (query: string) => Promise<any[]>;

const query = (async (query: string) => {
  return new Promise((resolve, reject) => {
    connection.query(query, (error, res) => {
      if (error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });
}) as QueryFunction;

async function main() {
  await cleanDb(prisma);
  await createCreditCategories(prisma);
  const semesters = await createSemesters(prisma);
  const ues = await migrateUEs(query, prisma);
  await migrateUsers(query, prisma, ues, semesters);
}

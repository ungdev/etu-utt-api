import { PrismaClient } from '@prisma/client';
import { createConnection } from 'mysql';
import { cleanDb } from '../../test/utils/test_utils';
import { migrateUEs } from './modules/ue';
import { createCreditCategories } from './modules/creditCategory';
import { createSemesters } from './modules/semester';
import { migrateUeComments } from './modules/ueComment';
import { createBranches } from './modules/branch';

const prisma = new PrismaClient();
console.log('Connected to new database');

const res = /^mysql:\/\/(.*):(.*)@(.*):(.*)\/(.*)$/.exec(process.env.OLD_DATABASE_URL);
const [, user, password, host, port, database] = res;
const connection = createConnection({ host, user, password, port: Number.parseInt(port), database });

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to old database');
    console.error(err);
    return;
  }
  console.log('Connected to old database');
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
  await migrateUEs(query, prisma);
  //await migrateUsers(query, prisma, ues, semesters);
  await migrateUeComments(query, prisma, semesters);
  await createBranches(prisma);
}

import { PrismaClient } from '@prisma/client';
import { createConnection } from 'mysql';
import { cleanDb } from '../../test/utils/test_utils';
import { migrateUEs } from './modules/ue';
import { createCreditCategories } from './modules/creditCategory';
import { createSemesters } from './modules/semester';
import {migrateUeComments, softMigrateUeComments} from './modules/ueComment';
import { createBranches } from './modules/branch';

let prisma = new PrismaClient();
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
  const argv = process.argv.slice(2);
  if (argv[0] === '--drop-all') {
    await cleanDb(prisma);
    await createCreditCategories(prisma);
    const semesters = await createSemesters(prisma);
    await migrateUEs(query, prisma);
    //await migrateUsers(query, prisma, ues, semesters);
    await migrateUeComments(query, prisma, semesters);
    await createBranches(prisma);
  } else if (argv.length === 0) {
    extendPrismaToSoftMigrate();
    migrate();
    const from = new Date(Date.parse(argv[1]));
    if (isNaN(from.getTime())) {
      console.error('Invalid timestamp');
      return;
    }
    const semesters = await prisma.semester.findMany();
    await softMigrateUeComments(query, prisma, semesters);
  } else {
    console.error('Invalid arguments. Usage: make-migration.ts [--drop-all]');
  }
}

function extendPrismaToSoftMigrate() {
  const originalPrisma = prisma;
  prisma = prisma.$extends({
    model: {
      semester: {
        async create({ code, start, end }: { code: string; start: Date; end: Date }) {
          const semester = originalPrisma.semester.findFirst({ where: { code: this.code } });
          if (!semester) {
            return originalPrisma.semester.create({ data: this });
          } else {
            return semester;
        }
      }
    }
  })
}

function migrate() {

}

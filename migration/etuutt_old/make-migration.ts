import { PrismaClient as _PrismaClient } from '@prisma/client';
import { createConnection } from 'mysql';
import { cleanDb } from '../../test/utils/test_utils';
import { findLegacyUeofName, migrateUEs } from './modules/ue';
import { createCreditCategories } from './modules/creditCategory';
import { createSemesters } from './modules/semester';
import { migrateUeComments } from './modules/ueComment';
import { createBranches } from './modules/branch';
import {
  RawBranch,
  RawBranchOption,
  RawCreditCategory,
  RawSemester,
  RawUe,
  RawUeComment,
} from '../../src/prisma/types';
import { stringToTranslation } from './utils';
import { omit } from '../../src/utils';

type MayBePromise<T> = Promise<T> | T;

export type PrismaClient = typeof prisma;
export type PrismaOperationType = 'created' | 'updated' | 'notChanged';
export type PrismaOperationResult<T> = { data: T; operation: PrismaOperationType };
export async function getOperationResults<T>(operations: MayBePromise<PrismaOperationResult<T>>[]) {
  return (await Promise.all(operations)).reduce(
    (acc, { data, operation }) => {
      acc.data.push(data);
      acc[operation]++;
      return acc;
    },
    { data: [] as T[], created: 0, updated: 0, notChanged: 0 },
  );
}

let ueId = -1;
const _prisma = new _PrismaClient();
const prisma = _prisma.$extends({
  model: {
    semester: {
      async create({
        code,
        start,
        end,
      }: {
        code: string;
        start: Date;
        end: Date;
      }): Promise<PrismaOperationResult<RawSemester>> {
        const semester = await _prisma.semester.findFirst({ where: { code } });
        if (!semester) {
          return { data: await _prisma.semester.create({ data: { code, start, end } }), operation: 'created' };
        }
        if (semester.start !== start || semester.end !== end) {
          return {
            data: await _prisma.semester.update({ where: { code }, data: { start, end } }),
            operation: 'updated',
          };
        }
        return { data: semester, operation: 'notChanged' };
      },
    },
    ue: {
      async create(params: {
        code: string;
        name: string;
        workTime: {
          cm: number;
          td: number;
          tp: number;
          the: number;
          project: boolean;
          internship: number;
        };
        info: {
          program: string;
          objectives: string;
          languages: string;
          minors: string;
          comment: string;
        };
        credits: {
          credits: number;
          category: string;
        };
      }): Promise<PrismaOperationResult<RawUe>> {
        // Fix credit category types to match new categories
        if (params.credits.category === 'HP' || params.credits.category === 'OTHER') params.credits.category = 'AC';
        if (params.credits.category === 'MASTER') params.credits.category = 'MA';
        const { ue: ueCode, ueof: ueofCode } = findLegacyUeofName(params.code, params.info.comment);
        const ue = await _prisma.ue.findUnique({ where: { code: ueCode } });
        if (!ue) {
          return {
            data: await _prisma.ue.create({
              data: {
                code: ueCode,
                ueofs: {
                  connectOrCreate: {
                    where: {
                      code: ueofCode,
                    },
                    create: {
                      code: ueofCode,
                      siepId: ueId--,
                      available: false,
                      workTime: {
                        create: params.workTime,
                      },
                      credits: {
                        create: {
                          credits: params.credits.credits,
                          category: {
                            connect: {
                              code: params.credits.category,
                            },
                          },
                        },
                      },
                      name: stringToTranslation(params.name),
                      info: {
                        create: {
                          program: stringToTranslation(params.info.program),
                          objectives: stringToTranslation(params.info.objectives),
                          language: params.info.languages,
                          minors: params.info.minors,
                        },
                      },
                    },
                  },
                },
              },
            }),
            operation: 'created',
          };
        }
        // Ok that would be crazy to check every field, let's not do that
        return {
          data: await _prisma.ue.update({
            where: { code: ueCode },
            data: {
              ueofs: {
                connectOrCreate: {
                  where: {
                    code: ueofCode,
                  },
                  create: {
                    code: ueofCode,
                    siepId: ueId--,
                    available: false,
                    workTime: {
                      create: params.workTime,
                    },
                    credits: {
                      create: {
                        credits: params.credits.credits,
                        category: {
                          connect: {
                            code: params.credits.category,
                          },
                        },
                      },
                    },
                    name: stringToTranslation(params.name),
                    info: {
                      create: {
                        program: stringToTranslation(params.info.program),
                        objectives: stringToTranslation(params.info.objectives),
                        language: params.info.languages,
                        minors: params.info.minors,
                      },
                    },
                  },
                },
              },
            },
          }),
          operation: 'updated',
        };
      },
    },
    ueCreditCategory: {
      async create({ code, name }: { code: string; name: string }): Promise<PrismaOperationResult<RawCreditCategory>> {
        const creditCategory = await _prisma.ueCreditCategory.findUnique({ where: { code } });
        if (!creditCategory) {
          return {
            data: await _prisma.ueCreditCategory.create({ data: { code, name } }),
            operation: 'created',
          };
        }
        if (creditCategory.name !== name) {
          return {
            data: await _prisma.ueCreditCategory.update({
              where: { code },
              data: { name: name },
            }),
            operation: 'updated',
          };
        }
        return { data: creditCategory, operation: 'notChanged' };
      },
    },
    uTTBranch: {
      async create({
        code,
        name,
        isMaster,
        description,
      }: {
        code: string;
        name: string;
        isMaster: boolean;
        description: string;
      }): Promise<PrismaOperationResult<RawBranch>> {
        const branch = await _prisma.uTTBranch.findUnique({
          where: { code },
          include: { descriptionTranslation: true },
        });
        if (!branch) {
          return {
            data: await _prisma.uTTBranch.create({
              data: { code, name, isMaster, descriptionTranslation: stringToTranslation(description) },
            }),
            operation: 'created',
          };
        }
        if (branch.name !== name || branch.descriptionTranslation.fr !== description) {
          return {
            data: await _prisma.uTTBranch.update({
              where: { code },
              data: { name, isMaster, descriptionTranslation: stringToTranslation(description) },
            }),
            operation: 'updated',
          };
        }
        return { data: omit(branch, 'descriptionTranslation'), operation: 'notChanged' };
      },
    },
    uTTBranchOption: {
      async create({
        code,
        name,
        branchCode,
        description,
      }: {
        code: string;
        name: string;
        branchCode: string;
        description: string;
      }): Promise<PrismaOperationResult<RawBranchOption>> {
        const option = await _prisma.uTTBranchOption.findUnique({
          where: { code_branchCode: { code, branchCode } },
          include: { descriptionTranslation: true },
        });
        if (!option) {
          return {
            data: await _prisma.uTTBranchOption.create({
              data: {
                code,
                name,
                descriptionTranslation: stringToTranslation(description),
                branch: { connect: { code: branchCode } },
              },
            }),
            operation: 'created',
          };
        }
        if (
          option.name !== name ||
          option.branchCode !== branchCode ||
          option.descriptionTranslation.fr !== description
        ) {
          return {
            data: await _prisma.uTTBranchOption.update({
              where: { code_branchCode: { code, branchCode } },
              data: {
                name,
                descriptionTranslation: stringToTranslation(description),
                branch: { connect: { code: branchCode } },
              },
            }),
            operation: 'updated',
          };
        }
        return { data: omit(option, 'descriptionTranslation'), operation: 'notChanged' };
      },
    },
    ueComment: {
      async create({
        body,
        createdAt,
        updatedAt,
        isValid,
        ue,
        semesterCode,
      }: {
        body: string;
        isAnonymous: boolean;
        createdAt: Date;
        updatedAt: Date;
        isValid: 0 | 1;
        ue: string;
        semesterCode: string;
      }): Promise<PrismaOperationResult<RawUeComment>> {
        const codes = findLegacyUeofName(ue, '');
        // check this is the correct ueof :
        let ueof = await _prisma.ueof.findFirst({ where: { code: codes.ueof } });
        if (!ueof) ueof = await _prisma.ueof.findFirst({ where: { code: codes.ueof.replace('TRO', 'REI') } });
        if (ueof) codes.ueof = codes.ueof.replace('TRO', 'REI');
        else console.error(`No such ueof for this code : ${codes.ueof}`);
        const comment = await _prisma.ueComment.findFirst({ where: { ueof: { ue: { code: codes.ue } }, createdAt } });
        if (!comment) {
          return {
            data: await _prisma.ueComment.create({
              data: {
                body,
                isAnonymous: true,
                createdAt,
                updatedAt,
                validatedAt: isValid ? updatedAt : null,
                ueof: { connect: { code: codes.ueof } },
                semester: { connect: { code: semesterCode } },
              },
            }),
            operation: 'created',
          };
        }
        if (
          comment.body !== body ||
          comment.updatedAt !== updatedAt ||
          (comment.validatedAt === null ? 0 : 1) !== isValid
        ) {
          return {
            data: await _prisma.ueComment.update({
              where: { id: comment.id },
              data: { body, updatedAt, validatedAt: isValid ? updatedAt : null },
            }),
            operation: 'updated',
          };
        }
        return { data: comment, operation: 'notChanged' };
      },
    },
  },
});
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
    await cleanDb(_prisma);
  } else if (argv.length !== 0) {
    console.error('Invalid arguments. Usage: pnpm db:migrate [--drop-all]');
    return;
  }
  await migrate(prisma);
}

async function migrate(prisma: PrismaClient) {
  await createCreditCategories(prisma);
  const semesters = await createSemesters(prisma);
  await migrateUEs(query, prisma);
  //await migrateUsers(query, prisma, ues, semesters);
  await migrateUeComments(query, prisma, semesters);
  await createBranches(prisma);
}

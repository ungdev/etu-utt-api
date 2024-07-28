import { createReadStream } from 'fs';
import { createInterface } from 'readline/promises';
import { parse } from '@fast-csv/parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type UEOF = {
  entry_nb: string;
  siep_id: number;
  ueof_code: string;
  code: string;
  name: string;
  objectives: string;
  program: string;
  lang: string;
  cm_hours: number;
  td_hours: number;
  tp_hours: number;
  the_hours: number;
  has_project: boolean;
  internship_hours: number;
  credit_count: number;
  engineer_credit_type?: string;
  master_credit_type?: string;
  semesters: string[];
  minors: string[];
  requirements: string[];
  engineer_branch: string[];
  engineer_branch_option: string[];
  master_branch: string[];
  master_branch_option: string[];
};
type DataHeader = keyof UEOF;

async function findPadding(document: string) {
  return new Promise<number>((resolve, reject) => {
    const readable = createReadStream(document);
    const reader = createInterface({ input: readable });
    let count = 0;
    reader
      .on('line', (line) => {
        count++;
        if (!line) {
          resolve(count);
          readable.destroy();
        }
      })
      .on('close', () => reject());
  });
}

async function parseDocument(document: string) {
  return new Promise<UEOF[]>(async (resolve, reject) => {
    const ues: UEOF[] = [];
    const padding = await findPadding(document);
    createReadStream(document)
      .pipe(
        parse({
          delimiter: ';',
          skipLines: padding,
          headers: [
            'entry_nb',
            'siep_id',
            'ueof_code',
            'code',
            'name',
            'objectives',
            'program',
            'cm_hours',
            'td_hours',
            'tp_hours',
            'the_hours',
            'internship_hours',
            'credit_count',
            'lang',
            'minors',
            'semesters',
            'has_project',
            'engineer_credit_type',
            'master_credit_type',
            'requirements',
            'engineer_branch',
            'engineer_branch_option',
            'master_branch_option',
            'master_branch',
          ] satisfies DataHeader[],
          renameHeaders: true,
        }),
      )
      .on('error', (error) => {
        console.error('\x1b[41;30mAn error occurred while parsing UE datasource\x1b[0m');
        console.error(error);
        reject();
      })
      .on('data', (ue) =>
        ues.push({
          ...ue,
          siep_id: Number(ue.siep_id),
          cm_hours: Number(ue.cm_hours) || 0,
          td_hours: Number(ue.td_hours) || 0,
          tp_hours: Number(ue.tp_hours) || 0,
          the_hours: Number(ue.the_hours) || 0,
          has_project: ue.has_project === 'OUI',
          internship_hours: Number(ue.internship_hours) || 0,
          credit_count: Number(ue.credit_count) || 0,
          requirements: ue.requirements ? [ue.requirements as unknown as string] : [],
          semesters: ue.semesters ? (ue.semesters as unknown as string)?.split(/\s\/\s/g) : [],
          minors: ue.minors ? (ue.minors as unknown as string)?.split(/\s\/\s/g) : [],
          engineer_branch: ue.engineer_branch ? (ue.engineer_branch as unknown as string)?.split(/\s\/\s/g) : [],
          engineer_branch_option: ue.engineer_branch_option
            ? (ue.engineer_branch_option as unknown as string)?.split(/\s\/\s/g)
            : [],
          master_branch: ue.master_branch ? (ue.master_branch as unknown as string)?.split(/\s\/\s/g) : [],
          master_branch_option: ue.master_branch_option
            ? (ue.master_branch_option as unknown as string)?.split(/\s\/\s/g)
            : [],
        }),
      )
      .on('end', () =>
        resolve(
          ues.reduce<UEOF[]>((prev, ueof) => {
            // Data has not been merged in the CSV for the field `requirements`, we need to merge it manually
            const existing = prev.find((ue) => ue.ueof_code === ueof.ueof_code);
            if (!existing) return [...prev, ueof];
            existing.requirements.push(...ueof.requirements);
            return prev;
          }, []),
        ),
      );
  });
}

async function main() {
  const importYear = new Date().getFullYear(); // Can be changed to the year of the import if done with web interface

  console.info('\x1b[42;30mFetching UE list\x1b[0m');
  const ues = await parseDocument('scripts/seed/ues.csv');
  await prisma.ueof.updateMany({
    data: { available: false },
  });

  console.info('\x1b[42;30mUpdating UEs\x1b[0m');
  const branches = await prisma.uTTBranch.findMany({
    select: {
      isMaster: true,
      code: true,
    },
  });
  for (const ue of ues) {
    // Generating ue credits (includes branch and branch options)
    const credits: { category: string; credits: number; branchOptions: string[] }[] = [];
    if (ue.engineer_credit_type)
      credits.push({
        category: ue.engineer_credit_type,
        credits: ue.credit_count,
        branchOptions: ue.engineer_branch_option.length
          ? ue.engineer_branch_option
          : ue.engineer_branch.length
          ? ue.engineer_branch
          : branches.filter((branch) => !branch.isMaster).map((branch) => branch.code),
      });
    if (ue.master_credit_type)
      credits.push({
        category: ue.master_credit_type,
        credits: ue.credit_count,
        branchOptions: ue.master_branch_option.length
          ? ue.master_branch_option
          : ue.master_branch.length
          ? ue.master_branch
          : branches.filter((branch) => branch.isMaster).map((branch) => branch.code),
      });
    if (ue.code === 'PE00')
      credits.push(
        ...['CS', 'TM', 'EC', 'ME', 'HT', 'AC'].map((code) => ({
          category: code,
          credits: ue.credit_count,
          branchOptions: branches.filter((branch) => !branch.isMaster).map((branch) => branch.code),
        })),
      );
    // Update database ue data
    await prisma.ueof.upsert({
      where: {
        code: ue.ueof_code,
      },
      create: {
        code: ue.ueof_code,
        siepId: ue.siep_id,
        ue: {
          connectOrCreate: {
            where: { code: ue.code },
            create: {
              code: ue.code,
              creationYear: 2000 + Number(ue.ueof_code.slice(-2)),
              updateYear: 2000 + Number(ue.ueof_code.slice(-2)),
            },
          },
        },
        name: {
          create: {
            fr: ue.name,
          },
        },
        available: true,
        info: {
          create: {
            language: ue.lang,
            minors: ue.minors.join(),
            objectives: {
              create: {
                fr: ue.objectives,
              },
            },
            program: {
              create: {
                fr: ue.program,
              },
            },
          },
        },
        workTime: {
          create: {
            cm: ue.cm_hours,
            td: ue.td_hours,
            tp: ue.tp_hours,
            the: ue.the_hours,
            internship: ue.internship_hours,
            project: ue.has_project,
          },
        },
        credits: {
          create: credits.map((credit) => ({
            credits: credit.credits,
            category: {
              connect: {
                code: credit.category,
              },
            },
            branchOptions: {
              connect: credit.branchOptions.map((code) => ({
                code: code,
              })),
            },
          })),
        },
        openSemester: {
          connect: ue.semesters.map((code) => ({
            code: `${code}${(importYear + Number(code === 'P')) % 100}`,
          })),
        },
      },
      update: {
        siepId: ue.siep_id,
        name: {
          update: {
            fr: ue.name,
          },
        },
        available: true,
        info: {
          update: {
            language: ue.lang,
            minors: ue.minors.join(),
            objectives: {
              update: {
                fr: ue.objectives,
              },
            },
            program: {
              update: {
                fr: ue.program,
              },
            },
          },
        },
        workTime: {
          update: {
            cm: ue.cm_hours,
            td: ue.td_hours,
            tp: ue.tp_hours,
            the: ue.the_hours,
            internship: ue.internship_hours,
            project: ue.has_project,
          },
        },
        credits: {
          deleteMany: {},
          create: credits.map((credit) => ({
            credits: credit.credits,
            category: {
              connect: {
                code: credit.category,
              },
            },
            branchOptions: {
              connect: credit.branchOptions.map((code) => ({
                code: code,
              })),
            },
          })),
        },
        openSemester: {
          connect: ue.semesters.map((code) => ({
            code: `${code}${(importYear + Number(code === 'P')) % 100}`,
          })),
        },
      },
    });
  }

  const aliases = await prisma.ueAlias.findMany();

  console.info('\x1b[42;30mImporting UE requirements...\x1b[0m');

  try {
    await Promise.all(
      ues.map((ueof) =>
        prisma.ueof.update({
          where: {
            code: ueof.ueof_code,
          },
          data: {
            ue: {
              update: {
                updateYear: 2000 + Number(ueof.ueof_code.slice(-2)),
              },
            },
            requirements: {
              connect: ueof.requirements
                .map((code) => {
                  const result = aliases.find((alias) => alias.code === code);
                  return result ? result.standsFor : code;
                })
                .filter((code) => code)
                .map((code) => ({
                  code: code,
                })),
            },
          },
        }),
      ),
    );
    console.info('\x1b[42;30m✅ Import complete\x1b[0m');
  } catch (error) {
    console.error(
      '\x1b[41;30mAn error occurred while importing UE requirements. Try `$ pnpm seed:ue:aliases` first.\x1b[0m',
    );
  }
}

main();

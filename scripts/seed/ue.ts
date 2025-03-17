import { createReadStream } from 'fs';
import { createInterface } from 'readline/promises';
import { parse } from '@fast-csv/parse';
import { PrismaClient } from '@prisma/client';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

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

function sanitize<T>(obj: T): T {
  if (typeof obj === 'string') {
    const output = obj
      .replaceAll(/(?![\n\r])\s/g, ' ')
      .replaceAll(/½(?=uvre)/g, 'œ')
      .replaceAll(/(?<=c)½(?=ur)/g, 'œ')
      .replaceAll(/(?:Þ|(?<=\n|\r|^)[?\-\u00ad])\s?/g, '• ')
      .replaceAll(/\u00ad|–/g, '-')
      .replaceAll(/a`/g, 'à')
      .replaceAll(/é´/g, 'é')
      .replaceAll('’', "'")
      .replaceAll(/(?<=[dls])¿/g, "'")
      .trim() as T & string;
    const match = output.match(/[^a-zA-Z0-9 éèàâ'ôîïêù\-\n\r?(),;":/_.û•ÉÊœ…«»ç&+]/g);
    if (match?.length)
      console.warn(`\x1b[45;30m[UNEXPECTED_GLYPH] ${match.map((c) => `"${c}"`).join(', ')}\x1b[0m. Check "${output}"`);
    return output;
  } else if (obj instanceof Array) return obj.map(sanitize) as T;
  else if (typeof obj === 'object')
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, sanitize(v)])) as T;
  return obj;
}

async function parseDocument(document: string) {
  return new Promise<UEOF[]>(async (resolve, reject) => {
    const ueofs: UEOF[] = [];
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
        ueofs.push({
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
          semesters: ue.semesters ? (ue.semesters as unknown as string).split(/\s\/\s/g) : [],
          minors: ue.minors ? (ue.minors as unknown as string).split(/\s\/\s/g) : [],
          engineer_branch: ue.engineer_branch ? (ue.engineer_branch as unknown as string).split(/\s\/\s/g) : [],
          engineer_branch_option: ue.engineer_branch_option
            ? (ue.engineer_branch_option as unknown as string)?.split(/\s\/\s/g)
            : [],
          master_branch: ue.master_branch ? (ue.master_branch as unknown as string).split(/\s\/\s/g) : [],
          master_branch_option: ue.master_branch_option
            ? (ue.master_branch_option as unknown as string).split(/\s\/\s/g)
            : [],
        }),
      )
      .on('end', () =>
        resolve(
          // A single UEOF can appear multiple times in the CSV with a different requirement
          // We group the UEOFs by their code and merge the requirements
          sanitize(
            Object.values(
              ueofs.reduce((acc, ueof) => {
                const key = ueof.ueof_code;
                if (!acc[key]) acc[key] = [];
                acc[key].push(ueof);
                return acc;
              }, {} as { [key: string]: UEOF[] }),
            ).map((duplicates) => ({
              ...duplicates[0],
              requirements: duplicates.flatMap((ueof) => ueof.requirements),
            })),
          ),
        ),
      );
  });
}

async function fetchINSUE() {
  const pdfjs = (await new Function(
    "return import('pdfjs-dist/legacy/build/pdf.mjs')",
  )()) as typeof import('pdfjs-dist');
  const variants = ['TC', 'RT', 'ISI', 'SN', 'GI', 'GM', 'MTE', 'A2I', 'MASTER', 'EC', 'HUMANITE', 'MANAGEMENT'];
  const entries: [string, string][] = [];
  for (const variant of variants) {
    const doc = await pdfjs.getDocument(
      `https://gestion.utt.fr/applis/service2/insuv/sql/fichiers/EdT_previsionnel_${variant}.pdf`,
    ).promise;
    for (let i = 0; i < doc.numPages; i++) {
      const page = await doc.getPage(i + 1);
      const textContent = await page.getTextContent();
      entries.push(
        ...textContent.items
          .map((value: TextItem, i) => [value.str, i] as [string | null, number])
          .filter(([item]) => item?.match(/^[AP]\d{2}_[^_]+_[^_]+_[^_]+/))
          .map<[string, string]>(([item, i]) => [item, (<TextItem>textContent.items[i + 2]).str]), // + 2 because there is an extra space
      );
    }
  }
  return entries;
}

async function main() {
  const importYear = Number(process.argv[2]) || new Date().getFullYear(); // Can be changed to the year of the import if done with web interface

  console.info('\x1b[42;30mFetching UE list\x1b[0m');
  const ues = await parseDocument('scripts/seed/dfp_data.csv');
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
            minors: ue.minors.length ? ue.minors.join() : null,
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
              connect: credit.branchOptions.map((id) => ({ id })),
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
            minors: ue.minors.length ? ue.minors.join() : null,
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
              connect: credit.branchOptions.map((id) => ({ id })),
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
  } catch (error) {
    console.error(
      '\x1b[41;30mAn error occurred while importing UE requirements. Try `$ pnpm seed:ue:aliases` first.\x1b[0m',
    );
    return;
  }
  console.info('\x1b[42;30mFetching current INSUEs\x1b[0m');
  try {
    const insues = await fetchINSUE();
    await Promise.all(
      insues.map(([ueof, insue]) =>
        prisma.ueof.updateMany({
          where: {
            code: {
              startsWith: ueof.slice(4),
            },
          },
          data: {
            inscriptionCode: insue,
          },
        }),
      ),
    );
  } catch (error) {
    console.error(
      '\x1b[41;30mAn error occurred while importing INSUEs. Check the network connection or DFP pdf structure.\x1b[0m',
    );
    return;
  }
  console.info('\x1b[42;30m✅ Import complete\x1b[0m');
}

main();

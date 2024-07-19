import { createReadStream } from 'fs';
import { parse } from '@fast-csv/parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type UEOF = {
  entry_nb: string;
  shortname: string;
  fullname: string;
  idnumber: string;
  category_idnumber: string;
  startdate: string;
  enddate: string;
  objectives: string;
  program: string;
  cm_hours: string;
  td_hours: string;
  tp_hours: string;
  the_hours: string;
  internship_hours: string;
  summary: string;
  lang: string;
};
type DataHeader = keyof UEOF;

async function parseDocument(document: string) {
  return new Promise<UEOF[]>((resolve, reject) => {
    const ues: UEOF[] = [];
    createReadStream(document)
      .pipe(
        parse({
          delimiter: ';',
          skipLines: 5,
          headers: [
            'entry_nb',
            'shortname',
            'fullname',
            'idnumber',
            'category_idnumber',
            'startdate',
            'enddate',
            'objectives',
            'program',
            'cm_hours',
            'td_hours',
            'tp_hours',
            'the_hours',
            'internship_hours',
            'summary',
            'lang',
          ] satisfies DataHeader[],
          renameHeaders: true,
        }),
      )
      .on('error', (error) => {
        console.error('\x1b[41;30mAn error occurred while parsing UE datasource\x1b[0m');
        console.error(error);
        reject();
      })
      .on('data', ues.push)
      .on('end', () => resolve(ues));
  });
}

async function main() {
  const ues = await parseDocument('scripts/seed/ues.csv');
  await prisma.ue.deleteMany({});
  const promises = ues.map(async (ue) => {
    await prisma.ue.create({
      data: {
        code: ue.shortname,
        inscriptionCode: ue.idnumber,
        name: {
          create: {
            fr: ue.fullname,
          },
        },
        info: {
          create: {
            comment: {
              create: {
                fr: ue.summary,
              },
            },
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
            languages: ue.lang,
          },
        },
        branchOption: {},
        subsequentUes: {},
        workTime: {
          create: {
            cm: Number(ue.cm_hours),
            td: Number(ue.td_hours),
            tp: Number(ue.tp_hours),
            the: Number(ue.the_hours),
            internship: Number(ue.internship_hours),
          },
        },
        credits: {
          create: {
            credits: 0,
            category: {
              connect: {
                code: 'CS',
              },
            },
          },
        },
      },
    });
  });
  await Promise.all(promises);
}

main();

import { QueryFunction } from '../make-migration';
import { PrismaClient } from '@prisma/client';
import { RawUE } from '../../../src/prisma/types';
import { stringToTranslation } from '../utils';

export async function migrateUEs(query: QueryFunction, prisma: PrismaClient) {
  const ues = await query('SELECT * FROM etu_uvs WHERE isOld = 0');
  const newUEs: RawUE[] = [];
  ues.sort((a, b) =>
    new RegExp(`(^|\W)${a.code}($|\W)`).test(b.antecedents)
      ? 1
      : new RegExp(`(^|\W)${b.code}($|\W)`).test(a.antecedents)
      ? -1
      : 0,
  );
  const inscriptionCodes: string[] = [];
  for (const ue of ues) {
    let inscriptionCode = ue.code.slice(0, 4);
    while (inscriptionCodes.includes(inscriptionCode)) {
      inscriptionCode =
        inscriptionCode.slice(0, 3) +
        Math.floor(Math.random() * 36)
          .toString(36)
          .toUpperCase();
    }
    inscriptionCodes.push(inscriptionCode);
    const requirements = newUEs.filter((u) => new RegExp(`(^|\W)${u.code}($|\W)`).test(ue.antecedents));
    newUEs.push(
      await prisma.uE.create({
        data: {
          code: ue.code,
          name: stringToTranslation(ue.name),
          inscriptionCode,
          workTime: {
            create: {
              cm: ue.cm,
              td: ue.td,
              tp: ue.tp,
              the: ue.the,
              project: ue.projet,
              internship: ue.stage,
            },
          },
          info: {
            create: {
              program: stringToTranslation(ue.programme),
              objectives: stringToTranslation(ue.objectifs),
              languages: ue.languages,
              minors: ue.mineurs,
              requirements: {
                connect: requirements.map((value) => ({ id: value.id })),
              },
              comment: stringToTranslation(ue.commentaire),
            },
          },
          credits: {
            create: {
              credits: ue.credits,
              category: {
                connect: {
                  code: ue.category === 'ct' ? 'HT' : ue.category.toUpperCase(),
                },
              },
            },
          },
        },
      }),
    );
  }
  console.log(`Migrated ${newUEs.length} UEs`);
  return newUEs;
}

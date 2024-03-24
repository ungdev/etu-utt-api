import { QueryFunction } from '../make-migration';
import { PrismaClient } from '@prisma/client';
import { RawUE, RawUECreditCategory } from '../../../src/prisma/types';

export async function migrateUEs(query: QueryFunction, prisma: PrismaClient) {
  const ues = await query('SELECT * FROM etu_ues');
  const newUEs: RawUE[] = [];
  ues.sort((a, b) =>
    new RegExp(`(^|\W)${a.code}($|\W)`).test(b.antecedents)
      ? 1
      : new RegExp(`(^|\W)${b.code}($|\W)`).test(a.antecedents)
      ? -1
      : 0,
  );
  for (const ue of ues) {
    const requirements = newUEs.filter((u) => new RegExp(`(^|\W)${u.code}($|\W)`).test(ue.antecedents));
    newUEs.push(
      await prisma.uE.create({
        data: {
          code: ue.code,
          name: ue.name,
          inscriptionCode: ue.code.slice(0, 4),
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
              program: ue.programme,
              objectives: ue.objectifs,
              languages: ue.languages,
              minors: ue.mineurs,
              requirements: {
                connect: requirements.map((value) => ({ id: value.id })),
              },
              comment: ue.commentaire,
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
  return newUEs;
}

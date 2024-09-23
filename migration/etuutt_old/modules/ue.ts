import { getOperationResults, PrismaOperationResult, QueryFunction } from '../make-migration';
import { PrismaClient } from '../make-migration';
import { RawUe } from '../../../src/prisma/types';

export function findLegacyUeofName(ueCode: string, commentaire: string) {
  let LOCATION = 'TRO';
  if (commentaire.match(/UE réalisée à Reims/)) LOCATION = 'REI';
  let UECODE = ueCode;
  let LANG = 'FR';
  if (ueCode.length > 4 && ueCode.slice(-1).match(/[APR]/)) {
    const modifier = ueCode.slice(-1);
    UECODE = ueCode.slice(0, -1);
    if (modifier === 'A') LANG = 'EN';
    if (modifier === 'R') LOCATION = 'REI';
  }
  if (ueCode.startsWith('LG')) LANG = 'GE';
  if (ueCode.startsWith('IT')) LANG = 'IT';
  if (ueCode.startsWith('KO')) LANG = 'KO';
  if (ueCode.startsWith('LC')) LANG = 'CH';
  if (ueCode.startsWith('LP')) LANG = 'PO';
  if (ueCode.startsWith('LS')) LANG = 'SP';
  return { ue: UECODE, ueof: `${UECODE}_${LANG}_${LOCATION}_LEG` };
}

export async function migrateUEs(query: QueryFunction, prisma: PrismaClient) {
  const ues = await query('SELECT * FROM etu_uvs WHERE isOld = 0');
  const operations: PrismaOperationResult<RawUe>[] = [];
  ues.sort((a, b) =>
    new RegExp(`(^|\\W)${a.code}($|\\W)`).test(b.antecedents)
      ? 1
      : new RegExp(`(^|\\W)${b.code}($|\\W)`).test(a.antecedents)
      ? -1
      : 0,
  );
  for (const ue of ues) {
    operations.push(
      await prisma.ue.create({
        code: ue.code,
        name: ue.name,
        workTime: {
          cm: ue.cm,
          td: ue.td,
          tp: ue.tp,
          the: ue.the,
          project: ue.projet > 0,
          internship: ue.stage,
        },
        info: {
          program: ue.programme,
          objectives: ue.objectifs,
          languages: ue.languages,
          minors: ue.mineurs,
          comment: ue.commentaire,
        },
        credits: {
          credits: ue.credits,
          category: ue.category === 'ct' ? 'HT' : ue.category.toUpperCase(),
        },
      }),
    );
  }
  const results = await getOperationResults(operations);
  console.log(`UEs : created ${results.created}, updated ${results.updated}, not changed ${results.notChanged}`);
  let linkingOperations = 0;
  for (const ue of ues) {
    const { ue: ueCode, ueof: ueofCode } = findLegacyUeofName(ue.code, ue.commentaire);
    const requirements = operations
      .filter((u) => new RegExp(`(^|\\W)${u.data.code}($|\\W)`).test(ue.antecedents))
      .map((u) => u.data.code);
    if (requirements.length === 0) continue;
    linkingOperations++;
    prisma.ue.update({
      where: { code: ueCode },
      data: {
        ueofs: {
          update: {
            where: {
              code: ueofCode,
            },
            data: {
              requirements: {
                connect: requirements.map((value) => ({ code: value })),
              },
            },
          },
        },
      },
    });
  }
  console.log(`UEs : linked ${linkingOperations}`);
  return results.data;
}

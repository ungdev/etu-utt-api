import { getOperationResults, PrismaOperationResult, QueryFunction } from '../make-migration';
import { PrismaClient } from '../make-migration';
import { RawUE } from '../../../src/prisma/types';

export async function migrateUEs(query: QueryFunction, prisma: PrismaClient) {
  const ues = await query('SELECT * FROM etu_uvs WHERE isOld = 0');
  const operations: PrismaOperationResult<RawUE>[] = [];
  ues.sort((a, b) =>
    new RegExp(`(^|\W)${a.code}($|\W)`).test(b.antecedents)
      ? 1
      : new RegExp(`(^|\W)${b.code}($|\W)`).test(a.antecedents)
      ? -1
      : 0,
  );
  const inscriptionCodes: string[] = (await prisma.uE.findMany({ select: { inscriptionCode: true } })).map(({inscriptionCode }) => inscriptionCode);
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
    const requirements = operations
      .filter((u) => new RegExp(`(^|\W)${u.data.code}($|\W)`).test(ue.antecedents))
      .map((u) => u.data.id);
    //console.log(ue.code, inscriptionCode);
    operations.push(
      await prisma.uE.create({
        code: ue.code,
        name: ue.name,
        inscriptionCode,
        workTime: {
          cm: ue.cm,
          td: ue.td,
          tp: ue.tp,
          the: ue.the,
          project: ue.projet,
          internship: ue.stage,
        },
        info: {
          program: ue.programme,
          objectives: ue.objectifs,
          languages: ue.languages,
          minors: ue.mineurs,
          requirements,
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
  return results.data;
}

import { getOperationResults, PrismaOperationResult, QueryFunction } from '../make-migration';
import { PrismaClient } from '../make-migration';
import { RawSemester, RawUEComment } from '../../../src/prisma/types';

export async function migrateUeComments(query: QueryFunction, prisma: PrismaClient, semesters: RawSemester[]) {
  const comments = await query(
    '' +
      'SELECT c.body, c.createdAt, c.updatedAt, c.isValide, u.code ' +
      'FROM etu_uvs_comments c ' +
      'INNER JOIN etu_uvs u ON c.uv_id = u.id ' +
      `WHERE c.deletedAt IS NULL AND u.isOld = 0`,
  );
  const operations: Promise<PrismaOperationResult<RawUEComment>>[] = [];
  for (const comment of comments) {
    const semester = semesters.find(
      (semester) => semester.start <= comment.createdAt && semester.end >= comment.createdAt,
    );
    if (!semester) {
      console.error(`Could not find semester for date ${comment.createdAt}. Comment is not going to be migrated.`);
      continue;
    }
    operations.push(
      prisma.uEComment.create({
        body: comment.body,
        isAnonymous: true,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        isValid: comment.isValide,
        ue: comment.code,
        semesterCode: semester.code,
      }),
    );
  }

  const results = await getOperationResults(operations);
  console.log(
    `UE comments : created ${results.created}, updated ${results.updated}, not changed ${results.notChanged}`,
  );
}

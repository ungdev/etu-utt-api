import { QueryFunction } from '../make-migration';
import { PrismaClient } from '@prisma/client';
import { RawSemester } from '../../../src/prisma/types';

export async function migrateUeComments(query: QueryFunction, prisma: PrismaClient, semesters: RawSemester[]) {
  const comments = await query(
    '' +
      'SELECT c.body, c.createdAt, c.updatedAt, c.isValide, u.code ' +
      'FROM etu_uvs_comments c ' +
      'INNER JOIN etu_uvs u ON c.uv_id = u.id ' +
      'WHERE c.deletedAt IS NULL AND u.isOld = 0',
  );
  let createdCommentsCount = 0;
  for (const comment of comments) {
    const semester = semesters.find(
      (semester) => semester.start <= comment.createdAt && semester.end >= comment.createdAt,
    );
    if (!semester) {
      console.error(`Could not find semester for date ${comment.createdAt}. Comment is not going to be migrated.`);
      continue;
    }
    await prisma.uEComment.create({
      data: {
        body: comment.body,
        isAnonymous: true,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        validatedAt: comment.isValide ? comment.updatedAt : null,
        ue: {
          connect: {
            code: comment.code,
          },
        },
        semester: {
          connect: {
            code: semester.code,
          },
        },
      },
    });
    createdCommentsCount++;
  }

  console.log(`Migrated ${createdCommentsCount} comments`);
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // SEMESTERS //
  await prisma.semester.deleteMany({});
  await prisma.semester.create({
    data: {
      code: 'P24',
      start: new Date('2024-02-01'),
      end: new Date('2024-09-01'),
    },
  });
  await prisma.semester.create({
    data: {
      code: 'A24',
      start: new Date('2024-08-31'),
      end: new Date('2025-02-01'),
    },
  });

  // UE CATEGORIES //
  console.log('Updating UE Categories');
  const categories = [
    { code: 'CS', name: 'Connaissances scientifiques' },
    { code: 'TM', name: 'Techniques et méthodes' },
    { code: 'ST', name: 'Stage' },
    { code: 'HT', name: 'Humanités et technologies' },
    { code: 'ME', name: 'Mise en situation' },
    { code: 'EC', name: 'Expression et communication' },
  ];
  await Promise.all(
    categories.map((category) =>
      prisma.ueCreditCategory.upsert({
        where: {
          code: category.code,
        },
        update: category,
        create: category,
      }),
    ),
  );
}

main();

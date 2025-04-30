import { readdir, readFile, writeFile } from 'fs/promises';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const annalTypes = {
  final: 'Final',
  median: 'Médian',
  dm: 'Devoir Maison',
  partiel: 'Partiel',
};

async function main() {
  const folderPath = process.argv[2] || 'scripts/seed/ues';

  const ueDirectories = Object.fromEntries(
    (
      await Promise.all(
        (
          await readdir(folderPath, { withFileTypes: true })
        )
          .filter((dirent) => dirent.isDirectory())
          .map(async (dirent) => {
            const dirname = dirent.name;
            return (await readdir(`${folderPath}/${dirname}`, { withFileTypes: true }))
              .filter((dir) => dir.isDirectory())
              .map((dir) => [dir.name, `${folderPath}/${dirname}/${dir.name}`]);
          }),
      )
    ).flat(),
  ) as Record<string, string>;

  const databaseUeofs = (
    await prisma.ueof.findMany({
      select: { code: true },
    })
  ).map((ueof) => ueof.code);

  // console.log(ueDirectories);
  for (const [ueName, uePath] of Object.entries(ueDirectories)) {
    const annals = (await readdir(uePath, { withFileTypes: true })).filter((dirent) =>
      dirent.name.match(/\.(png|jpeg|jpg|pdf|tiff)$/),
    );
    const other = (await readdir(uePath, { withFileTypes: true })).filter(
      (dirent) => !dirent.name.match(/\.(png|jpeg|jpg|pdf|tiff)$/) && !dirent.name.match(/^ue(?:\.md)?\.docx$/),
    );
    if (other.length > 0) console.log(other);

    // Import annal files
    for (const annal of annals) {
      const name = annal.name
        .replace(/\.[^.]+$/, '')
        .replace(
          /[-_](?=(?<sem1>[AP]\d{4})?(?<ue1>[^-_]*(?![AP]\d{4}))?)[^-_]*[-_](?=(?<sem2>[AP]\d{4})?(?<ue2>[^-_]*(?![AP]\d{4}))?)[^-_]*/i,
          '-$<sem1>$<sem2>-$<ue1>$<ue2>',
        )
        .replace(/(?<=-[AP])20(?=\d{2}-)/, '');
      const [type, semester] = name.split('-');
      if (!(type in annalTypes)) console.warn(`Unknown annal type: ${type}`);
      const ueofs = databaseUeofs
        .filter(
          (ueof) =>
            ueof.startsWith(`${ueName.replace(/A$/, '')}_`) &&
            (Number(semester.slice(1)) >= Number(ueof.slice(-2)) || ueof.endsWith('U23')),
        )
        .sort((a, b) => {
          const ueofVector = Number(ueName.endsWith('A')) && Number(/_EN_/.test(b)) - Number(/_EN_/.test(a));
          if (ueofVector) return ueofVector;
          return Number(a.slice(-2)) - Number(b.slice(-2));
        });

      // console.info(`[NAME FIX] ${annal.name} -> ${name}`);
      // console.log(`[UEOF SELECTION] ${ueName} -> ${ueofs[0]}`);

      if (!ueofs.length) console.warn(`[UEOF SELECTION FAILED] ${ueName}`);
      else {
        const { id } = await prisma.ueAnnal.create({
          data: {
            type: {
              connect: {
                name: annalTypes[type],
              },
            },
            uploadComplete: true,
            ueof: {
              connect: {
                code: ueofs[0],
              },
            },
            semester: {
              connectOrCreate: {
                where: {
                  code: semester,
                },
                create: {
                  code: semester,
                  start: new Date(),
                  end: new Date(),
                },
              },
            },
          },
        });
        await writeFile(`uploads/exams/${id}.pdf`, (await readFile(`${uePath}/${annal.name}`)) as Uint8Array);
      }
    }
  }

  console.info('\x1b[42;30m✅ Import complete\x1b[0m');
}

main();

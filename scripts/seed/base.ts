import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // SEMESTERS //
  await prisma.semester.deleteMany({});
  await prisma.semester.create({
    data: {
      code: 'A24',
      start: new Date('2024-08-31'),
      end: new Date('2025-01-20'),
    },
  });
  await prisma.semester.create({
    data: {
      code: 'H24',
      start: new Date('2025-01-21'),
      end: new Date('2025-02-14'),
    },
  });
  await prisma.semester.create({
    data: {
      code: 'P25',
      start: new Date('2025-02-15'),
      end: new Date('2025-06-29'),
    },
  });
  await prisma.semester.create({
    data: {
      code: 'E25',
      start: new Date('2025-07-01'),
      end: new Date('2025-08-30'),
    },
  });
  await prisma.semester.create({
    data: {
      code: 'U24',
      start: new Date('2024-08-31'),
      end: new Date('2025-06-29'),
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
    { code: 'AC', name: 'Autres Crédits' },
    { code: 'MA', name: 'Master' },
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

  // BRANCHES //
  console.log('Updating Branches');
  const branches = [
    { code: 'TC', name: 'Tronc commun', isMaster: false },
    { code: 'RT', name: 'Réseaux et télécommunications', isMaster: false },
    { code: 'GM', name: 'Génie mécanique', isMaster: false },
    { code: 'GM_APPR', name: 'Génie mécanique - Apprentissage', isMaster: false },
    { code: 'A2I', name: 'Automatique et informatique industrielle', isMaster: false },
    { code: 'MTE', name: 'Matériaux: Technologie et Economie', isMaster: false },
    { code: 'ISI', name: "Informatique et Systèmes d'Information", isMaster: false },
    { code: 'SN_APPR', name: 'Systèmes Numériques - Apprentissage', isMaster: false },
    { code: 'MM', name: 'Matériaux et Mécanique', isMaster: false },
    { code: 'GI', name: 'Génie Industriel', isMaster: false },
    { code: 'GI_APPR', name: 'Génie Industriel - Apprentissage', isMaster: false },
    { code: 'RE', name: 'Risques et Environnement', isMaster: true },
    { code: 'PAIP', name: 'Physique Appliquée et Ingénierie Physique', isMaster: true },
    { code: 'ISC', name: 'Ingénierie des Systèmes Complexes', isMaster: true },
    { code: 'IC', name: 'Ingénierie de Conception', isMaster: true },
  ];
  await Promise.all(
    branches.map((branch) =>
      prisma.uTTBranch.upsert({
        where: {
          code: branch.code,
        },
        update: branch,
        create: {
          ...branch,
          descriptionTranslation: {
            create: {},
          },
        },
      }),
    ),
  );

  // BRANCH OPTIONS //
  console.log('Updating branch options');
  const branch_options = [
    { code: 'TC', name: 'Tronc commun', branch: 'TC' },
    { code: 'GM', name: 'Tronc commun de Génie Mécanique', branch: 'GM' },
    { code: 'A2I', name: "Tronc commun d'Automatique et informatique industrielle", branch: 'A2I' },
    { code: 'MTE', name: 'Tronc commun de Matériaux: Technologie et Economie', branch: 'MTE' },
    { code: 'GM_APPR', name: 'Tronc commun de Génie mécanique - Apprentissage', branch: 'GM_APPR' },
    { code: 'ISI', name: "Tronc commun d'Informatique et Systèmes d'Information", branch: 'ISI' },
    { code: 'MM', name: 'Tronc commun de Matériaux et Mécanique', branch: 'MM' },
    { code: 'GI_APPR', name: 'Tronc commun de Génie Industriel - Apprentissage', branch: 'GI_APPR' },
    { code: 'SN_APPR', name: 'Tronc commun de Systèmes Numériques - Apprentissage', branch: 'SN_APPR' },
    { code: 'RT', name: 'Tronc commun de Réseaux et télécommunications', branch: 'RT' },
    { code: 'GI', name: 'Tronc commun de Génie Industriel', branch: 'GI' },
    { code: 'MDPI_APPR', name: 'Management Digital des Produits et Infrastructures - Apprentissage', branch: 'GM' },
    { code: 'LIP_APPR', name: 'Logistique interne et production - Apprentissage', branch: 'GI' },
    { code: 'LET_APPR', name: 'Logistique externe et transport - Apprentissage', branch: 'GI' },
    { code: 'TQM', name: 'Transformation et qualité des matériaux', branch: 'MTE' },
    { code: 'TCMC', name: 'Technologie et commerce des matériaux et des composants', branch: 'MTE' },
    { code: 'TEI', name: 'Technologie embarquée et interopérabilité', branch: 'A2I' },
    { code: 'SPI', name: 'Systèmes de production intelligents', branch: 'A2I' },
    {
      code: 'CEISME',
      name: "Conception et industrialisation des systèmes mécaniques, en lien avec l'environnement",
      branch: 'GM',
    },
    { code: 'EME', name: 'Énergie, matériaux et environnement', branch: 'MTE' },
    { code: 'SSC', name: 'Sécurité des systèmes et des communications', branch: 'RT' },
    { code: 'IPL', name: 'Innovation par le logiciel', branch: 'ISI' },
    { code: 'ATN', name: 'Accompagnement de la Transformation Numérique', branch: 'ISI' },
    { code: 'VDC', name: 'Valorisation des données et des connaissances', branch: 'ISI' },
    { code: 'TMOC', name: 'Technologies mobiles et objets connectés', branch: 'RT' },
    { code: 'MDPI', name: 'Management Digital des Produits et infrastructures', branch: 'GM' },
    { code: 'SNM', name: 'Simulation numérique en mécanique', branch: 'GM' },
    { code: 'CSR', name: 'Convergence service réseaux', branch: 'RT' },
    { code: 'RAMS', name: 'Fiabilité, Maintenance, Disponibilité et Sûreté', branch: 'GI' },
    { code: 'RAMS_APPR', name: 'Fiabilité, Maintenance, Disponibilité et Sûreté - Apprentissage', branch: 'GI' },
    { code: 'SN', name: 'Tronc commun de Systèmes Numériques', branch: 'SN_APPR' },
    { code: 'LIP', name: 'Logistique interne et production', branch: 'GI' },
    { code: 'LET', name: 'Logistique externe et transport', branch: 'GI' },
    { code: 'RE', name: 'Mention Risques et Environnement', branch: 'RE' },
    { code: 'PAIP', name: 'Mention Physique Appliquée et Ingénierie Physique', branch: 'PAIP' },
    { code: 'ISC', name: 'Mention Ingénierie des Systèmes Complexes', branch: 'ISC' },
    { code: 'IC', name: 'Mention Ingénierie de Conception', branch: 'IC' },
    { code: 'IMEDD', name: "Ingénierie et Management de l'Environnement et du Développement Durable", branch: 'RE' },
    { code: 'SSI', name: "Sécurité des Systèmes d'Information", branch: 'ISC' },
    { code: 'NPHOT', name: 'Nano-optics and Nanophotonics', branch: 'PAIP' },
    { code: 'MPSMP', name: 'Mécanique et Performance en Service de Matériaux et Produits', branch: 'IC' },
    { code: 'OSS', name: 'Optimisation et Sûreté des Systèmes', branch: 'ISC' },
    { code: 'IMSGA', name: 'Ingénierie et Management en Sécurité Globale Appliquée', branch: 'RE' },
  ];
  await Promise.all(
    branch_options.map((option) =>
      prisma.uTTBranchOption.upsert({
        where: {
          code_branchCode: {
            code: option.code,
            branchCode: option.branch,
          },
        },
        update: {
          branchCode: option.branch,
          name: option.name,
        },
        create: {
          code: option.code,
          name: option.name,
          branch: {
            connect: {
              code: option.branch,
            },
          },
          descriptionTranslation: {
            create: {},
          },
        },
      }),
    ),
  );
}

main();

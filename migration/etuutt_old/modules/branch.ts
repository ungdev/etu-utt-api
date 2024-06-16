import { PrismaClient } from '@prisma/client';
import { RawBranchOption } from '../../../src/prisma/types';
import { stringToTranslation } from '../utils';

export async function createBranches(prisma: PrismaClient) {
  const branches: Promise<Promise<RawBranchOption>[]>[] = [
    TC(prisma),
    A2I(prisma),
    GI(prisma),
    GM(prisma),
    ISI(prisma),
    MTE(prisma),
    MM(prisma),
    RT(prisma),
    SN(prisma),
  ];
  const createdBranchOptions = await Promise.all((await Promise.all(branches)).flat(1)); // Wow, that's a nice one
  console.log(`Created ${branches.length} branches and ${createdBranchOptions.length} branchOptions`);
}

function TC(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      data: {
        code: 'TCBR',
        name: 'TCBR',
        descriptionTranslation: stringToTranslation(''),
      },
    })
    .then((branch) => [
      prisma.uTTBranchOption.create({
        data: {
          code: 'TCBR_TC',
          name: 'TCBR',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
    ]);
}

function A2I(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      data: {
        code: 'A2I',
        name: 'Automatique et Informatique Industrielle',
        descriptionTranslation: stringToTranslation(''),
      },
    })
    .then((branch) => [
      prisma.uTTBranchOption.create({
        data: {
          code: 'TCBR_A2I',
          name: 'TCBR',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'LIBRE',
          name: 'Filière LIBRE A2I',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'SPI',
          name: 'Systèmes de Production Intelligents',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'TEI',
          name: 'Technologie Embarquée et Interopérabilité',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
    ]);
}

function GI(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      data: {
        code: 'GI',
        name: 'Génie Industriel',
        descriptionTranslation: stringToTranslation(''),
      },
    })
    .then((branch) => [
      prisma.uTTBranchOption.create({
        data: {
          code: 'TCBR',
          name: 'Tronc commun de branche',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'LET',
          name: 'Logistique Externe et Transport',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'LIP',
          name: 'Logistique Interne et Production',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'RAMS',
          name: 'Reliability, Availability, Maintenance and Safety',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
    ]);
}

function GM(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      data: {
        code: 'GM',
        name: 'Génie Mécanique',
        descriptionTranslation: stringToTranslation(''),
      },
    })
    .then((branch) => [
      prisma.uTTBranchOption.create({
        data: {
          code: 'TCBR',
          name: 'Tronc commun de branche',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'CEISME',
          name: "Conception Et Industrialisation des Systèmes Mécaniques, en lien avec l'Environnement",
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'MDPI',
          name: 'Management Digital des Produits et Infrastructures',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'SNM',
          name: 'Simulation Numérique en Mécanique',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
    ]);
}

function ISI(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      data: {
        code: 'ISI',
        name: "Informatique et Systèmes d'Information",
        descriptionTranslation: stringToTranslation(''),
      },
    })
    .then((branch) => [
      prisma.uTTBranchOption.create({
        data: {
          code: 'TCBR',
          name: 'Tronc commun de branche',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'ATM',
          name: 'Accompagnement de la transformation numérique',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'IPL',
          name: 'Innovation par le logiciel',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'VDC',
          name: 'Valorisation des données et des connaissances',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
    ]);
}

function MTE(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      data: {
        code: 'MTE',
        name: 'Matériaux : Technologie et Economie',
        descriptionTranslation: stringToTranslation(''),
      },
    })
    .then((branch) => [
      prisma.uTTBranchOption.create({
        data: {
          code: 'TCBR',
          name: 'Tronc commun de branche',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'EME',
          name: 'Energie, Matériaux et Environnement',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'AUTO',
          name: 'Technologie et Commerce des Matériaux et des Composants',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'TQM',
          name: 'Transformation et Qualité des Matériaux',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
    ]);
}

function MM(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      data: {
        code: 'MM',
        name: 'Matériaux et Mécanique',
        descriptionTranslation: stringToTranslation(''),
      },
    })
    .then((branch) => [
      prisma.uTTBranchOption.create({
        data: {
          code: 'TCBR',
          name: 'Tronc commun de branche',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
    ]);
}

function RT(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      data: {
        code: 'RT',
        name: 'Réseaux et Télécommunications',
        descriptionTranslation: stringToTranslation(''),
      },
    })
    .then((branch) => [
      prisma.uTTBranchOption.create({
        data: {
          code: 'TCBR',
          name: 'Tronc commun de branche',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'CSR',
          name: 'Convergence Services et Réseaux',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'SSC',
          name: 'Sécurité des Systèmes et des Communications',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
      prisma.uTTBranchOption.create({
        data: {
          code: 'TMOC',
          name: 'Technologies Mobiles et Objets Connectés',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
    ]);
}

function SN(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      data: {
        code: 'SN',
        name: 'Systèmes Numériques',
        descriptionTranslation: stringToTranslation(''),
      },
    })
    .then((branch) => [
      prisma.uTTBranchOption.create({
        data: {
          code: 'TCBR',
          name: 'Tronc commun de branche',
          descriptionTranslation: stringToTranslation(''),
          branch: { connect: { code: branch.code } },
        },
      }),
    ]);
}

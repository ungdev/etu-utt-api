import { getOperationResults, PrismaClient, PrismaOperationResult } from '../make-migration';
import { RawBranch, RawBranchOption } from '../../../src/prisma/types';

export async function createBranches(prisma: PrismaClient) {
  const operations: Promise<{
    branch: PrismaOperationResult<RawBranch>;
    branchOptions: Promise<PrismaOperationResult<RawBranchOption>>[];
  }>[] = [
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
  const operationsAwaited = await Promise.all(operations);
  const branchOptions = await getOperationResults(operationsAwaited.map(({ branchOptions }) => branchOptions).flat(1));
  const branches = await getOperationResults(operationsAwaited.map(({ branch }) => branch));
  console.log(
    `Branches : created ${branches.created}, updated ${branches.updated}, not changed ${branches.notChanged}`,
  );
  console.log(
    `Branch options : created ${branchOptions.created}, updated ${branchOptions.updated}, not changed ${branchOptions.notChanged}`,
  );
}

function TC(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'TCBR',
      name: 'TCBR',
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'TCBR_TC',
          name: 'TCBR',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

function A2I(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'A2I',
      name: 'Automatique et Informatique Industrielle',
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'TCBR',
          name: 'TCBR',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'LIBRE',
          name: 'Filière LIBRE A2I',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'SPI',
          name: 'Systèmes de Production Intelligents',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'TEI',
          name: 'Technologie Embarquée et Interopérabilité',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

function GI(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'GI',
      name: 'Génie Industriel',
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'TCBR',
          name: 'Tronc commun de branche',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'LET',
          name: 'Logistique Externe et Transport',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'LIP',
          name: 'Logistique Interne et Production',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'RAMS',
          name: 'Reliability, Availability, Maintenance and Safety',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

function GM(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'GM',
      name: 'Génie Mécanique',
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'TCBR',
          name: 'Tronc commun de branche',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'CEISME',
          name: "Conception Et Industrialisation des Systèmes Mécaniques, en lien avec l'Environnement",
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'MDPI',
          name: 'Management Digital des Produits et Infrastructures',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'SNM',
          name: 'Simulation Numérique en Mécanique',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

function ISI(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'ISI',
      name: "Informatique et Systèmes d'Information",
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'TCBR',
          name: 'Tronc commun de branche',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'ATM',
          name: 'Accompagnement de la transformation numérique',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'IPL',
          name: 'Innovation par le logiciel',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'VDC',
          name: 'Valorisation des données et des connaissances',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

function MTE(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'MTE',
      name: 'Matériaux : Technologie et Economie',
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'TCBR',
          name: 'Tronc commun de branche',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'EME',
          name: 'Energie, Matériaux et Environnement',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'AUTO',
          name: 'Technologie et Commerce des Matériaux et des Composants',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'TQM',
          name: 'Transformation et Qualité des Matériaux',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

function MM(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'MM',
      name: 'Matériaux et Mécanique',
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'TCBR',
          name: 'Tronc commun de branche',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

function RT(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'RT',
      name: 'Réseaux et Télécommunications',
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'TCBR',
          name: 'Tronc commun de branche',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'CSR',
          name: 'Convergence Services et Réseaux',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'SSC',
          name: 'Sécurité des Systèmes et des Communications',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'TMOC',
          name: 'Technologies Mobiles et Objets Connectés',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

function SN(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'SN',
      name: 'Systèmes Numériques',
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'TCBR',
          name: 'Tronc commun de branche',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

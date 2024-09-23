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
    GI_APPR(prisma),
    GM(prisma),
    GM_APPR(prisma),
    ISI(prisma),
    MTE(prisma),
    MM(prisma),
    RT(prisma),
    SN_APPR(prisma),
    RE(prisma),
    PAIP(prisma),
    ISC(prisma),
    IC(prisma),
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
      code: 'TC',
      name: 'Tronc commun',
      isMaster: false,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'TC',
          name: 'Tronc commun',
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
      isMaster: false,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'A2I',
          name: "Tronc commun d'Automatique et informatique industrielle",
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
      isMaster: false,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'GI',
          name: 'Tronc commun de Génie Industriel',
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
        prisma.uTTBranchOption.create({
          code: 'LET_APPR',
          name: 'Logistique Externe et Transport - Apprentissage',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'LIP_APPR',
          name: 'Logistique Interne et Production - Apprentissage',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'RAMS_APPR',
          name: 'Reliability, Availability, Maintenance and Safety - Apprentissage',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

function GI_APPR(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'GI_APPR',
      name: 'Génie Industriel - Apprentissage',
      isMaster: false,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'GI_APPR',
          name: 'Tronc commun de Génie Industriel - Apprentissage',
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
      name: 'Génie Mécanique - Apprentissage',
      isMaster: false,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'GM',
          name: 'Tronc commun de Génie Mécanique',
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
          code: 'MDPI_APPR',
          name: 'Management Digital des Produits et Infrastructures - Apprentissage',
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

function GM_APPR(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'GM_APPR',
      name: 'Génie Mécanique',
      isMaster: false,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'GM_APPR',
          name: 'Tronc commun de Génie mécanique - Apprentissage',
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
      isMaster: false,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'ISI',
          name: "Tronc commun d'Informatique et Systèmes d'Information",
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
      isMaster: false,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'MTE',
          name: 'Tronc commun de Matériaux: Technologie et Economie',
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
          code: 'TCMC',
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
      isMaster: false,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'MM',
          name: 'Tronc commun de Matériaux et Mécanique',
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
      isMaster: false,
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'RT',
          name: 'Tronc commun de Réseaux et télécommunications',
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

function SN_APPR(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'SN_APPR',
      name: 'Systèmes Numériques - Apprentissage',
      isMaster: false,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'SN_APPR',
          name: 'Tronc commun de Systèmes Numériques - Apprentissage',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'SN',
          name: 'Tronc commun de Systèmes Numériques',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

function RE(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'RE',
      name: 'Risques et Environnement',
      isMaster: true,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'RE',
          name: 'Mention Risques et Environnement',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'IMEDD',
          name: "Ingénierie et Management de l'Environnement et du Développement Durable",
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'IMSGA',
          name: 'Ingénierie et Management en Sécurité Globale Appliquée',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

function PAIP(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'PAIP',
      name: 'Physique Appliquée et Ingénierie Physique',
      isMaster: true,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'PAIP',
          name: 'Mention Physique Appliquée et Ingénierie Physique',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'NPHOT',
          name: 'Nano-optics and Nanophotonics',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

function ISC(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'ISC',
      name: 'Ingénierie des Systèmes Complexes',
      isMaster: true,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'ISC',
          name: 'Mention Ingénierie des Systèmes Complexes',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'SSI',
          name: "Sécurité des Systèmes d'Information",
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'OSS',
          name: 'Optimisation et Sûreté des Systèmes',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

function IC(prisma: PrismaClient) {
  return prisma.uTTBranch
    .create({
      code: 'IC',
      name: 'Ingénierie de Conception',
      isMaster: true,
      description: '',
    })
    .then((branch) => ({
      branch,
      branchOptions: [
        prisma.uTTBranchOption.create({
          code: 'IC',
          name: 'Mention Ingénierie de Conception',
          description: '',
          branchCode: branch.data.code,
        }),
        prisma.uTTBranchOption.create({
          code: 'MPSMP',
          name: 'Mécanique et Performance en Service de Matériaux et Produits',
          description: '',
          branchCode: branch.data.code,
        }),
      ],
    }));
}

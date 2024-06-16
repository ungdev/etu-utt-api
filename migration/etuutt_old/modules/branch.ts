import {PrismaClient} from "@prisma/client";
import {RawBranch, RawBranchOption} from "../../../src/prisma/types";
import {stringToTranslation} from "../utils";

export async function createBranches(prisma: PrismaClient) {
  const branches: Promise<Promise<RawBranchOption>[]>[] = [
    TC(prisma),
    A2I(prisma),
  ];
  const createdBranchOptions = await Promise.all((await Promise.all(branches)).flat(1));  // Wow, that's a nice one
  console.log(`Created ${branches.length} branches and ${createdBranchOptions.length} branchOptions`);
}

function TC(prisma: PrismaClient) {
  return prisma.uTTBranch.create({
    data: {
      code: 'TCBR',
      name: 'TCBR',
      descriptionTranslation: stringToTranslation(''),
    },
  }).then((branch) => [
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
  return prisma.uTTBranch.create({
    data: {
      code: 'A2I',
      name: 'Automatique et Informatique Industrielle',
      descriptionTranslation: stringToTranslation(''),
    },
  }).then((branch) => [
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

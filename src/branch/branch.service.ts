import { PrismaService } from '@/prisma/prisma.service.js';
import { Injectable } from '@nestjs/common';
import { SelectBranch } from '@/branch/interface/branch.interface.js';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  async getBranches() {
    return this.prisma.uTTBranch.findMany(SelectBranch({}));
  }
}

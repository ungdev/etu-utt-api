import { Module } from '@nestjs/common';
import { BranchService } from '@/branch/branch.service.js';
import { BranchController } from '@/branch/branch.controller.js';

@Module({
  providers: [BranchService],
  controllers: [BranchController],
})
export class BranchModule {}

import { Module } from '@nestjs/common';
import { BranchService } from '@/branch/branch.service';
import { BranchController } from '@/branch/branch.controller';

@Module({
  providers: [BranchService],
  controllers: [BranchController],
})
export class BranchModule {}

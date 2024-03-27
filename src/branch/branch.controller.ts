import { Controller, Get } from '@nestjs/common';
import { BranchService } from './branch.service';
import { IsPublic } from '../auth/decorator';
import { Branch } from './interface/branch.interface';

@Controller('branch')
export class BranchController {
  constructor(private branchService: BranchService) {}

  @IsPublic()
  @Get('')
  async getBranches() {
    return (await this.branchService.getBranches()).map(this.formatBranch);
  }

  private formatBranch(branch: Branch) {
    return {
      code: branch.code,
      name: branch.name,
      options: branch.branchOptions.map((option) => ({
        code: option.code,
        name: option.name,
      })),
    };
  }
}

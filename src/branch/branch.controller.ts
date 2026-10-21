import { Controller, Get } from '@nestjs/common';
import { BranchService } from '@/branch/branch.service.js';
import { IsPublic } from '@/auth/decorator/index.js';
import { Branch } from '@/branch/interface/branch.interface.js';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BranchResDto } from '@/branch/dto/res/branch-res.dto.js';

@Controller('branch')
@ApiTags('Branch')
export class BranchController {
  constructor(private branchService: BranchService) {}

  @IsPublic()
  @Get()
  @ApiOperation({ description: 'Fetch the different branches existing at the UTT.' })
  @ApiOkResponse({ type: BranchResDto, isArray: true })
  async getBranches(): Promise<BranchResDto[]> {
    return (await this.branchService.getBranches()).map(this.formatBranch);
  }

  private formatBranch(branch: Branch) {
    return {
      code: branch.code,
      name: branch.name,
      branchOptions: branch.branchOptions.map((option) => ({
        code: option.code,
        name: option.name,
      })),
    };
  }
}

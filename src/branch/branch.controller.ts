import { Controller, Get } from '@nestjs/common';
import { BranchService } from './branch.service';
import { IsPublic } from '../auth/decorator';
import { Branch } from './interface/branch.interface';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import BranchResDto from './dto/res/branch-res.dto';

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

import { Translation } from '../../../prisma/types';
import { ApiProperty } from '@nestjs/swagger';

export class UeOverviewResDto {
  code: string;
  @ApiProperty({ type: String })
  name: Translation;
  credits: UeOverviewResDto_Credit[];
  info: UeOverviewResDto_Info;
  openSemester: UeOverviewResDto_OpenSemester[];
}

class UeOverviewResDto_Credit {
  credits: number;
  category: UeOverviewResDto_Credit_Category;
  branchOptions: UeOverviewResDto_BranchOption[];
}

class UeOverviewResDto_Credit_Category {
  code: string;
  name: string;
}

class UeOverviewResDto_BranchOption {
  code: string;
  name: string;
  branch: UeOverviewResDto_BranchOption_Branch;
}

class UeOverviewResDto_BranchOption_Branch {
  code: string;
  name: string;
}

class UeOverviewResDto_Info {
  requirements: string[];
  languages: string[];
  minors: string[];
}

class UeOverviewResDto_OpenSemester {
  code: string;
  start: Date;
  end: Date;
}

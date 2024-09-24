import { Translation } from '../../../prisma/types';
import { ApiProperty } from '@nestjs/swagger';

export default class UeOverviewResDto {
  code: string;
  inscriptionCode: string;
  @ApiProperty({ type: String })
  name: Translation;
  credits: UeOverviewResDto_Credit[];
  branchOption: UeOverviewResDto_BranchOption[];
  info: UeOverviewResDto_Info;
  openSemester: UeOverviewResDto_OpenSemester[];
}

class UeOverviewResDto_Credit {
  credits: number;
  category: UeOverviewResDto_Credit_Category;
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
  @ApiProperty({ type: String })
  comment: Translation;
  degree: string;
  languages: string;
  minors: string;
  @ApiProperty({ type: String })
  objectives: Translation;
  @ApiProperty({ type: String })
  program: Translation;
}

class UeOverviewResDto_OpenSemester {
  code: string;
  start: Date;
  end: Date;
}

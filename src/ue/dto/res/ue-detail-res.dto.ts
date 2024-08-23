import { Translation } from '../../../prisma/types';
import { ApiProperty } from '@nestjs/swagger';

export class UeDetailResDto {
  code: string;
  inscriptionCode: string;
  @ApiProperty({ type: String })
  name: Translation;
  credits: UeDetailResDto_Credit[];
  branchOption: UeDetailResDto_BranchOption[];
  info: UeDetailResDto_Info;
  openSemester: UeDetailResDto_OpenSemester[];
  workTime: UeDetailResDto_WorkTime;
  @ApiProperty({
    description: 'Keys are criterionId and values are the marks',
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  starVotes: { [criterionId: string]: number };
}

class UeDetailResDto_Credit {
  credits: number;
  category: UeDetailResDto_Credit_Category;
}

class UeDetailResDto_Credit_Category {
  code: string;
  name: string;
}

class UeDetailResDto_BranchOption {
  code: string;
  name: string;
  branch: UeDetailResDto_BranchOption_Branch;
}

class UeDetailResDto_BranchOption_Branch {
  code: string;
  name: string;
}

class UeDetailResDto_Info {
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

class UeDetailResDto_OpenSemester {
  code: string;
  start: Date;
  end: Date;
}

class UeDetailResDto_WorkTime {
  cm: number;
  td: number;
  tp: number;
  the: number;
  project: number;
  internship: number;
}

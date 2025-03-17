import { Translation } from '../../../prisma/types';
import { ApiProperty } from '@nestjs/swagger';

export class UeDetailResDto {
  code: string;
  creationYear: number;
  updateYear: number;
  ueofs: UeofDetailResDto[];
  @ApiProperty({
    description: 'Keys are criterionId and values are the marks',
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  starVotes?: { [criterionId: string]: number; voteCount: number };
}

export class UeofDetailResDto {
  code: string;
  @ApiProperty({ type: String })
  name: Translation;
  siepId: number;
  inscriptionCode: string;

  credits: UeDetailResDto_Credit[];
  info: UeDetailResDto_Info;
  openSemester: UeDetailResDto_OpenSemester[];
  workTime: UeDetailResDto_WorkTime;
}

class UeDetailResDto_Credit {
  credits: number;
  category: UeDetailResDto_Credit_Category;
  branchOptions: UeDetailResDto_BranchOption[];
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
  language: string;
  minors: string[];
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
  project: boolean;
  internship: number;
}

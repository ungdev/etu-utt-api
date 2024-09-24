export default class BranchResDto {
  code: string;
  name: string;
  branchOptions: BranchResDto_BranchOption[];
}

class BranchResDto_BranchOption {
  code: string;
  name: string;
}

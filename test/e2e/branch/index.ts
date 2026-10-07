import { E2EAppProvider } from '#/utils/test_utils';
import { GetBranchesE2ESpec } from '#/e2e/branch/get-branches.e2e-spec';
import { describe } from 'vitest';

export default function BranchE2ESpec(app: E2EAppProvider) {
  describe.skip('Branch', () => {
    GetBranchesE2ESpec(app);
  });
}

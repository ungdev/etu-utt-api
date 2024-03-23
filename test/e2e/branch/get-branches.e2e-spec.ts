import { e2eSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { sortArray } from '../../../src/utils';

export const GetBranchesE2ESpec = e2eSuite('GET /branch', (app) => {
  const branch1 = fakedb.createBranch(app);
  const branch2 = fakedb.createBranch(app);
  const branchOption1 = fakedb.createBranchOption(app, { branch: branch2 });
  const branchOption2 = fakedb.createBranchOption(app, { branch: branch2 });

  it('should return all branches', () =>
    pactum
      .spec()
      .get('/branch')
      .expectStatus(HttpStatus.OK)
      .expectJson(
        sortArray(
          [
            {
              code: branch1.code,
              name: branch1.name,
              branchOptions: [],
            },
            {
              code: branch2.code,
              name: branch2.name,
              branchOptions: sortArray(
                [
                  {
                    code: branchOption1.code,
                    name: branchOption1.name,
                  },
                  {
                    code: branchOption2.code,
                    name: branchOption2.name,
                  },
                ],
                (branchOption) => branchOption.code,
              ),
            },
          ],
          (branch) => branch.code,
        ),
      ));
});

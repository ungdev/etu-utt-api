import { FakeUe, createBranch, createBranchOption, createSemester, createUe, createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from 'src/exceptions';
import { e2eSuite } from '../../utils/test_utils';
import { registerUniqueValue } from '../../../prisma/seed/utils';
import { ConfigModule } from '../../../src/config/config.module';

const SearchE2ESpec = e2eSuite('GET /ue', (app) => {
  const user = createUser(app);
  const semesters = [
    createSemester(app, { code: registerUniqueValue('semester', 'code', 'A24') }),
    createSemester(app),
  ];
  const branches = [createBranch(app), createBranch(app)];
  const branchOptions = [
    createBranchOption(app, {
      branch: branches[0],
    }),
    createBranchOption(app, {
      branch: branches[0],
    }),
    createBranchOption(app, {
      branch: branches[1],
    }),
    createBranchOption(app, {
      branch: branches[1],
    }),
  ];
  const ues: FakeUe[] = [];
  for (let i = 0; i < 30; i++)
    ues.push(
      createUe(
        app,
        { branchOptions: [branchOptions[i % 4]] },
        {
          code: `XX${`${i}`.padStart(2, '0')}`,
          credits: [
            {
              category: {
                code: i % 3 == 0 ? 'CS' : 'TM',
                name: i % 3 == 0 ? 'CS' : 'TM',
              },
              credits: 6,
            },
          ],
          openSemesters: [semesters[i % 2]],
        },
      ),
    );

  it('should return a 400 as semester is in a wrong format', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue?q=XX01&availableAtSemester=AP28')
      .expectAppError(ERROR_CODE.PARAM_TOO_LONG, 'availableAtSemester');
  });

  it('should return a 400 as page is negative', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue?q=XX01&page=-1')
      .expectAppError(ERROR_CODE.PARAM_NOT_POSITIVE, 'page');
  });

  it('should return a list of all ues (within the first page)', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .expectUesWithPagination(app, ues.slice(0, app().get(ConfigModule).PAGINATION_PAGE_SIZE), ues.length);
  });

  it('should return a list of all ues (within the second page)', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('page', 2)
      .expectUesWithPagination(
        app,
        ues.slice(
          app().get(ConfigModule).PAGINATION_PAGE_SIZE,
          Math.min(30, app().get(ConfigModule).PAGINATION_PAGE_SIZE * 2),
        ),
        ues.length,
      );
  });

  it('should return a list of ues filtered by semester', () => {
    const expectedUes = ues.filter((ue) => ue.openSemesters.some((semester) => semester.code === 'A24'));
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('availableAtSemester', 'A24')
      .expectUesWithPagination(app, expectedUes, expectedUes.length);
  });

  it('should return a list of ues filtered by credit type', () => {
    const expectedUes = ues.filter((ue) => ue.credits.some((credit) => credit.category.code === 'CS'));
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('creditType', 'CS')
      .expectUesWithPagination(app, expectedUes, expectedUes.length);
  });

  it('should return a list of ues filtered by branch option', () => {
    const expectedUes = ues.filter((ue) =>
      ue.credits.some((credit) => credit.branchOptions.some((branchOption) => branchOption.code === 'T1')),
    );
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('branchOption', 'T1')
      .expectUesWithPagination(app, expectedUes, expectedUes.length);
  });

  it('should return a list of ues filtered by branch', () => {
    const expectedUes = ues.filter((ue) =>
      ue.credits.some((credit) => credit.branchOptions.some((branchOption) => branchOption.branch.code === 'B1')),
    );
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('branch', 'B1')
      .expectUesWithPagination(app, expectedUes, expectedUes.length);
  });

  it('should return a list of ues filtered by name', () => {
    const expectedUes = ues.filter((ue) => ue.code.includes('XX0'));
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('q', 'XX0')
      .expectUesWithPagination(app, expectedUes, expectedUes.length);
  });
});

export default SearchE2ESpec;

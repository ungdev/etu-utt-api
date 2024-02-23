import { FakeUE, createBranch, createBranchOption, createSemester, createUE, createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ConfigService } from '@nestjs/config';
import { ERROR_CODE } from 'src/exceptions';
import { e2eSuite } from '../../utils/test_utils';
import { UEOverView } from '../../../src/ue/interfaces/ue-overview.interface';
import { omit } from '../../../src/utils';
import { JsonLikeVariant } from '../../declarations';
import { registerUniqueValue } from '../../../prisma/seed/utils';

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
  const ues: FakeUE[] = [];
  for (let i = 0; i < 30; i++)
    ues.push(
      createUE(app, {
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
        branchOption: [branchOptions[i % 4]],
      }),
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

  it('should return a list of all ues (within the second page)', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('page', 2)
      .expectUEs(
        app,
        ues.slice(
          Number(app().get(ConfigService).get('PAGINATION_PAGE_SIZE')),
          Math.min(30, Number(app().get(ConfigService).get('PAGINATION_PAGE_SIZE') * 2)),
        ),
        ues.length,
      );
  });

  it('should return a list of ues filtered by semester', () => {
    const expectedUEs = ues.filter((ue) => ue.openSemesters.some((semester) => semester.code === 'A24'));
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('availableAtSemester', 'A24')
      .expectUEs(app, expectedUEs, expectedUEs.length);
  });

  it('should return a list of ues filtered by credit type', () => {
    const expectedUEs = ues.filter((ue) => ue.credits.some((credit) => credit.category.code === 'CS'));
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('creditType', 'CS')
      .expectUEs(app, expectedUEs, expectedUEs.length);
  });

  it('should return a list of ues filtered by filiere', () => {
    const expectedUEs = ues.filter((ue) => ue.branchOption.some((branchOption) => branchOption.code === 'T1'));
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('branchOption', 'T1')
      .expectUEs(app, expectedUEs, expectedUEs.length);
  });

  it('should return a list of ues filtered by branch', () => {
    const expectedUEs = ues.filter((ue) => ue.branchOption.some((branchOption) => branchOption.branch.code === 'B1'));
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('branch', 'B1')
      .expectUEs(app, expectedUEs, expectedUEs.length);
  });

  it('should return a list of ues filtered by name', () => {
    const expectedUEs = ues.filter((ue) => ue.code.includes('XX0'));
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('q', 'XX0')
      .expectUEs(app, expectedUEs, expectedUEs.length);
  });
});

export default SearchE2ESpec;

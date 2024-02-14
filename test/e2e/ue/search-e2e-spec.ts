import { createUE, createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ConfigService } from '@nestjs/config';
import { ERROR_CODE } from 'src/exceptions';
import { e2eSuite } from '../../utils/test_utils';

const SearchE2ESpec = e2eSuite('GET /ue', (app) => {
  const user = createUser(app);
  const ues = [];
  for (let i = 0; i < 30; i++)
    ues.push(
      createUE(app, {
        code: `XX${`${i}`.padStart(2, '0')}`,
        semester: i % 2 == 1 ? 'A24' : 'P24',
        category: i % 3 == 0 ? 'CS' : 'TM',
        branchOption: i % 4 == 0 ? 'T1' : 'T2',
        branch: i % 5 == 0 ? 'B1' : 'B2',
        forOverview: true,
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

  it('should return a list of all ues (within the first page)', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .expectUEs(app, ues.slice(0, Number(app().get(ConfigService).get('PAGINATION_PAGE_SIZE'))), ues.length);
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
    const expectedUEs = ues.filter((ue) => ue.openSemester.some((semester) => semester.code === 'A24'));
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
    const expectedUEs = ues.filter((ue) => ue.name.includes('XX0'));
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('q', 'XX0')
      .expectUEs(app, expectedUEs, expectedUEs.length);
  });
});

export default SearchE2ESpec;

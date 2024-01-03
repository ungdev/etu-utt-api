import { createUE, createUser, suite } from '../../test_utils';
import * as pactum from 'pactum';
import { ConfigService } from '@nestjs/config';
import { ERROR_CODE } from 'src/exceptions';

const SearchE2ESpec = suite('GET /ue', (app) => {
  const user = createUser(app);
  const ues = [];
  for (let i = 0; i < 30; i++)
    ues.push(
      createUE(app, {
        code: `XX${`${i}`.padStart(2, '0')}`,
        semester: i % 2 == 1 ? 'A24' : 'P24',
        category: i % 3 == 0 ? 'CS' : 'TM',
        filiere: i % 4 == 0 ? 'T1' : 'T2',
        branch: i % 5 == 0 ? 'B1' : 'B2',
        forOverview: true,
      }),
    );

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .get('/ue?q=XX01')
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 400 as semester is in a wrong format', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue?q=XX01&availableAtSemester=AP28')
      .expectAppError(ERROR_CODE.MALFORMED_PARAM, 'availableAtSemester');
  });

  it('should return a 400 as page is negative', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue?q=XX01&page=-1')
      .expectAppError(ERROR_CODE.MALFORMED_PARAM, 'page');
  });

  it('should return a list of all ues (within the first page)', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .expectUEs({
        items: ues.slice(
          0,
          Number(app().get(ConfigService).get('PAGINATION_PAGE_SIZE')),
        ),
        itemCount: ues.length,
        itemsPerPage: Number(
          app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
        ),
      });
  });

  it('should return a list of all ues (within the second page)', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('page', 2)
      .expectUEs({
        items: ues.slice(
          Number(app().get(ConfigService).get('PAGINATION_PAGE_SIZE')),
          Math.min(
            30,
            Number(app().get(ConfigService).get('PAGINATION_PAGE_SIZE') * 2),
          ),
        ),
        itemCount: ues.length,
        itemsPerPage: Number(
          app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
        ),
      });
  });

  it('should return a list of ues filtered by semester', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('availableAtSemester', 'A24')
      .expectUEs({
        items: ues.filter((ue) =>
          ue.openSemester.some((semester) => semester.code === 'A24'),
        ),
        itemCount: ues.filter((ue) =>
          ue.openSemester.some((semester) => semester.code === 'A24'),
        ).length,
        itemsPerPage: Number(
          app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
        ),
      });
  });

  it('should return a list of ues filtered by credit type', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('creditType', 'CS')
      .expectUEs({
        items: ues.filter((ue) =>
          ue.credits.some((credit) => credit.category.code === 'CS'),
        ),
        itemCount: ues.filter((ue) =>
          ue.credits.some((credit) => credit.category.code === 'CS'),
        ).length,
        itemsPerPage: Number(
          app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
        ),
      });
  });

  it('should return a list of ues filtered by filiere', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('filiere', 'T1')
      .expectUEs({
        items: ues.filter((ue) =>
          ue.filiere.some((filiere) => filiere.code === 'T1'),
        ),
        itemCount: ues.filter((ue) =>
          ue.filiere.some((filiere) => filiere.code === 'T1'),
        ).length,
        itemsPerPage: Number(
          app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
        ),
      });
  });

  it('should return a list of ues filtered by branch', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('branch', 'B1')
      .expectUEs({
        items: ues.filter((ue) =>
          ue.filiere.some((filiere) => filiere.branche.code === 'B1'),
        ),
        itemsPerPage: Number(
          app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
        ),
        itemCount: ues.filter((ue) =>
          ue.filiere.some((filiere) => filiere.branche.code === 'B1'),
        ).length,
      });
  });

  it('should return a list of ues filtered by name', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('q', 'XX0')
      .expectUEs({
        items: ues.filter((ue) => ue.code.startsWith('XX0')),
        itemsPerPage: Number(
          app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
        ),
        itemCount: ues.filter((ue) => ue.code.startsWith('XX0')).length,
      });
  });
});

export default SearchE2ESpec;

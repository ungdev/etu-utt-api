import { createUE, createUser, suite } from '../../test_utils';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const UEToUEOverView = (
  ue: ReturnType<typeof createUE> extends Promise<infer R> ? R : never,
) => {
  delete ue.createdAt;
  delete ue.id;
  delete ue.updatedAt;
  delete ue.validationRate;
  delete ue.info.id;
  delete ue.info.UEId;
  return {
    ...ue,
    openSemester: ue.openSemester.map((semester) => ({
      ...semester,
      start: semester.start.toISOString(),
      end: semester.end.toISOString(),
    })),
    credits: ue.credits.map((credit) => ({
      credits: credit.credits,
      category: credit.category,
    })),
    filiere: ue.filiere.map((filiere) => ({
      code: filiere.code,
      name: filiere.name,
      branche: {
        code: filiere.branche.code,
        name: filiere.branche.name,
      },
    })),
  };
};

const SearchE2ESpec = suite('Search', (app) => {
  const user = createUser(app);
  const ues = [];

  beforeAll(async () => {
    for (let i = 0; i < 30; i++)
      ues.push(
        await createUE(app, {
          code: `XX${`${i}`.padStart(2, '0')}`,
          semester: i % 2 == 1 ? 'A24' : 'P24',
          category: i % 3 == 0 ? 'CS' : 'TM',
          filiere: i % 4 == 0 ? 'T1' : 'T2',
          branch: i % 5 == 0 ? 'B1' : 'B2',
        }),
      );
  });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .get('/ue?q=XX01')
      .expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 400 as semester is in a wrong format', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue?q=XX01&availableAtSemester=AP28')
      .expectStatus(HttpStatus.BAD_REQUEST);
  });

  it('should return a 400 as page is negative', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue?q=XX01&page=-1')
      .expectStatus(HttpStatus.BAD_REQUEST);
  });

  it('should return a list of all ues (within the first page)', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .expectStatus(HttpStatus.OK)
      .expectBody(
        ues
          .slice(
            0,
            Number(app().get(ConfigService).get('PAGINATION_PAGE_SIZE')),
          )
          .map(UEToUEOverView),
      );
  });

  it('should return a list of all ues (within the second page)', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('page', 2)
      .expectStatus(HttpStatus.OK)
      .expectBody(
        ues
          .slice(
            Number(app().get(ConfigService).get('PAGINATION_PAGE_SIZE')),
            Math.min(
              30,
              Number(app().get(ConfigService).get('PAGINATION_PAGE_SIZE') * 2),
            ),
          )
          .map(UEToUEOverView),
      );
  });

  it('should return a list of ues filtered by semester', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('availableAtSemester', 'A24')
      .expectStatus(HttpStatus.OK)
      .expectBody(
        ues
          .filter((ue) =>
            ue.openSemester.some((semester) => semester.code === 'A24'),
          )
          .map(UEToUEOverView),
      );
  });

  it('should return a list of ues filtered by credit type', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('creditType', 'CS')
      .expectStatus(HttpStatus.OK)
      .expectBody(
        ues
          .filter((ue) =>
            ue.credits.some((credit) => credit.category.code === 'CS'),
          )
          .map(UEToUEOverView),
      );
  });

  it('should return a list of ues filtered by filiere', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('filiere', 'T1')
      .expectStatus(HttpStatus.OK)
      .expectBody(
        ues
          .filter((ue) => ue.filiere.some((filiere) => filiere.code === 'T1'))
          .map(UEToUEOverView),
      );
  });

  it('should return a list of ues filtered by branch', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('branch', 'B1')
      .expectStatus(HttpStatus.OK)
      .expectBody(
        ues
          .filter((ue) =>
            ue.filiere.some((filiere) => filiere.branche.code === 'B1'),
          )
          .map(UEToUEOverView),
      );
  });

  it('should return a list of ues filtered by name', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('q', 'XX0')
      .expectStatus(HttpStatus.OK)
      .expectBody(
        ues.filter((ue) => ue.code.startsWith('XX0')).map(UEToUEOverView),
      );
  });
});

export default SearchE2ESpec;

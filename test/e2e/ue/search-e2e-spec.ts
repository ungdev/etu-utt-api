import { FakeUE, createBranch, createBranchOption, createSemester, createUE, createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ConfigService } from '@nestjs/config';
import { ERROR_CODE } from 'src/exceptions';
import { e2eSuite } from '../../utils/test_utils';
import { UEOverView } from '../../../src/ue/interfaces/ue-overview.interface';
import { omit } from '../../../src/utils';
import { JsonLikeVariant } from '../../declarations';

const SearchE2ESpec = e2eSuite('GET /ue', (app) => {
  const user = createUser(app);
  const semesters = [createSemester(app, { code: '!A24' }), createSemester(app)];
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
      createUE(
        app,
        { semesters: [semesters[i % 2]], branchOption: branchOptions[(i * 3) % 4] },
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
      .expectUEs({
        items: ues.slice(0, Number(app().get(ConfigService).get('PAGINATION_PAGE_SIZE'))).map(toOverview),
        itemCount: ues.length,
        itemsPerPage: Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')),
      });
  });

  it('should return a list of all ues (within the second page)', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('page', 2)
      .expectUEs({
        items: ues
          .slice(
            Number(app().get(ConfigService).get('PAGINATION_PAGE_SIZE')),
            Math.min(30, Number(app().get(ConfigService).get('PAGINATION_PAGE_SIZE') * 2)),
          )
          .map(toOverview),
        itemCount: ues.length,
        itemsPerPage: Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')),
      });
  });

  it('should return a list of ues filtered by semester', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('availableAtSemester', 'A24')
      .expectUEs({
        items: ues.filter((ue) => ue.openSemesters.some((semester) => semester.code === 'A24')).map(toOverview),
        itemCount: ues.filter((ue) => ue.openSemesters.some((semester) => semester.code === 'A24')).length,
        itemsPerPage: Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')),
      });
  });

  it('should return a list of ues filtered by credit type', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('creditType', 'CS')
      .expectUEs({
        items: ues.filter((ue) => ue.credits.some((credit) => credit.category.code === 'CS')).map(toOverview),
        itemCount: ues.filter((ue) => ue.credits.some((credit) => credit.category.code === 'CS')).length,
        itemsPerPage: Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')),
      });
  });

  it('should return a list of ues filtered by filiere', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('branchOption', branchOptions[0].code)
      .expectUEs({
        items: ues
          .filter((ue) => ue.branchOption.some((branchOption) => branchOption.code === branchOptions[0].code))
          .map(toOverview),
        itemCount: ues.filter((ue) =>
          ue.branchOption.some((branchOption) => branchOption.code === branchOptions[0].code),
        ).length,
        itemsPerPage: Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')),
      });
  });

  it('should return a list of ues filtered by branch', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue')
      .withQueryParams('branch', branches[0].code)
      .expectUEs({
        items: ues
          .filter((ue) => ue.branchOption.some((branchOption) => branchOption.branch.code === branches[0].code))
          .map(toOverview),
        itemsPerPage: Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')),
        itemCount: ues.filter((ue) =>
          ue.branchOption.some((branchOption) => branchOption.branch.code === branches[0].code),
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
        items: ues.filter((ue) => ue.code.startsWith('XX0')).map(toOverview),
        itemsPerPage: Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')),
        itemCount: ues.filter((ue) => ue.code.startsWith('XX0')).length,
      });
  });
});

function toOverview(fakeUE: FakeUE): JsonLikeVariant<UEOverView> {
  return {
    code: fakeUE.code,
    inscriptionCode: fakeUE.inscriptionCode,
    name: fakeUE.name,
    credits: fakeUE.credits.map((credit) => ({
      credits: credit.credits,
      category: {
        code: credit.category.code,
        name: credit.category.name,
      },
    })),
    openSemester: fakeUE.openSemesters.map((semester) => ({
      code: semester.code,
      start: semester.start.toISOString(),
      end: semester.end.toISOString(),
    })),
    branchOption: fakeUE.branchOption.map((branchOption) => ({
      code: branchOption.code,
      name: branchOption.name,
      branch: {
        code: branchOption.branch.code,
        name: branchOption.branch.name,
      },
    })),
    info: {
      ...(omit(fakeUE.info, 'requirements', 'id', 'ueId') as Required<Omit<FakeUE['info'], 'requirements'>>),
      requirements: fakeUE.info.requirements.map((requirement) => ({
        code: requirement.code,
      })),
    },
  };
}

export default SearchE2ESpec;

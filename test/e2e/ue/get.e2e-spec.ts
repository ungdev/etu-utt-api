import {
  FakeUE,
  createBranch,
  createBranchOption,
  createCriterion,
  createSemester,
  createUE,
  createUERating,
  createUESubscription,
  createUser,
} from '../../utils/fakedb';
import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { omit } from '../../../src/utils';

const GetE2ESpec = e2eSuite('GET /ue/{ueCode}', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, {
    login: 'user2',
    studentId: 2,
  });
  const semesters = [createSemester(app), createSemester(app)];
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
  const ueWithRating = createUE(
    app,
    { semesters, branchOption: branchOptions[0] },
    {
      code: `XX30`,
    },
  );
  const criterion = createCriterion(app);
  createUESubscription(app, { user, ue: ueWithRating, semester: semesters[0] });
  createUESubscription(app, { user: user2, ue: ueWithRating, semester: semesters[0] });
  createUERating(app, { user, criterion, ue: ueWithRating }, { value: 3 });
  createUERating(app, { user: user2, criterion, ue: ueWithRating }, { value: 5 });

  it('should return an error if the ue does not exist', () => {
    return pactum.spec().withBearerToken(user.token).get('/ue/AA01').expectAppError(ERROR_CODE.NO_SUCH_UE, 'AA01');
  });

  it('should return the UE XX01', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/XX01')
      .expectUE({
        name: ues[1].name,
        code: ues[1].code,
        inscriptionCode: ues[1].inscriptionCode,
        info: {
          ...omit(ues[1].info as Required<FakeUE['info']>, 'requirements', 'id', 'ueId'),
          requirements: ues[1].info.requirements.map((r) => ({
            code: r.code,
          })),
        },
        branchOption: [
          {
            code: branchOptions[3].code,
            name: branchOptions[3].name,
            branch: {
              code: branches[1].code,
              name: branches[1].name,
            },
          },
        ],
        credits: [
          {
            credits: ues[1].credits[0].credits,
            category: ues[1].credits[0].category,
          },
        ],
        openSemester: [semesters[1].code],
        starVotes: {},
        workTime: omit(ues[1].workTime, 'ueId', 'id') as Required<Omit<FakeUE['workTime'], 'ueId'>>,
      });
  });

  it('should return the UE XX30 with rating', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/XX30')
      .expectUE({
        name: ueWithRating.name,
        code: ueWithRating.code,
        inscriptionCode: ueWithRating.inscriptionCode,
        info: {
          ...omit(ueWithRating.info as Required<FakeUE['info']>, 'requirements', 'id', 'ueId'),
          requirements: ueWithRating.info.requirements.map((r) => ({
            code: r.code,
          })),
        },
        branchOption: [
          {
            code: branchOptions[0].code,
            name: branchOptions[0].name,
            branch: {
              code: branches[0].code,
              name: branches[0].name,
            },
          },
        ],
        credits: [
          {
            credits: ueWithRating.credits[0].credits,
            category: ueWithRating.credits[0].category,
          },
        ],
        openSemester: semesters.sort((a, b) => a.start.getTime() - b.start.getTime()).map((s) => s.code),
        workTime: omit(ueWithRating.workTime, 'ueId', 'id') as Required<Omit<FakeUE['workTime'], 'ueId'>>,
        starVotes: {
          [criterion.id]: 4.0,
        },
      });
  });
});

export default GetE2ESpec;

import {
  FakeUe,
  createBranch,
  createBranchOption,
  createCriterion,
  createSemester,
  createUe,
  createUeRating,
  createUeSubscription,
  createUser,
  FakeUeStarVote,
} from '../../utils/fakedb';
import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { computeRate } from '../../../src/ue/interfaces/ue.interface';

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
  const ues: FakeUe[] = [];
  for (let i = 0; i < 30; i++)
    ues.push(
      createUe(app, {
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
        branchOption: [branchOptions[(i * 3) % 4]],
      }),
    );
  const ueWithRating = createUe(app, {
    code: `XX30`,
    openSemesters: semesters,
    branchOption: [branchOptions[0]],
  });
  const criterion = createCriterion(app);
  createUeSubscription(app, { user, ue: ueWithRating, semester: semesters[0] });
  createUeSubscription(app, { user: user2, ue: ueWithRating, semester: semesters[0] });
  const rate1 = createUeRating(app, { user, criterion, ue: ueWithRating }, { value: 3 });
  const rate2 = createUeRating(app, { user: user2, criterion, ue: ueWithRating }, { value: 5 });

  it('should return an error if the ue does not exist', () => {
    return pactum.spec().withBearerToken(user.token).get('/ue/AA01').expectAppError(ERROR_CODE.NO_SUCH_UE, 'AA01');
  });

  it('should return the UE XX01', () => {
    return pactum.spec().withBearerToken(user.token).get('/ue/XX01').expectUe(ues[1]);
  });

  it('should return the UE XX30 with rating', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/XX30')
      .expectUe(ueWithRating, [
        {
          criterionId: criterion.id,
          value: computeRate([rate2 as Required<FakeUeStarVote>, rate1 as Required<FakeUeStarVote>]),
        },
      ]);
  });
});

export default GetE2ESpec;

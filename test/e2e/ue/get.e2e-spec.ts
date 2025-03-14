import {
  createBranch,
  createBranchOption,
  createCriterion,
  createSemester,
  createUe,
  createUeof,
  createUeRating,
  createUeSubscription,
  createUser,
  FakeUeStarVote,
} from '../../utils/fakedb';
import { e2eSuite } from '../../utils/test_utils';
import { UeController } from '../../../src/ue/ue.controller';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { UserType } from '@prisma/client';
import { FakeUeWithOfs } from 'test/declarations';

const GetE2ESpec = e2eSuite('GET /ue/{ueCode}', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, {
    login: 'user2',
    studentId: 2,
  });
  const user3 = createUser(app, {
    login: 'user3',
    studentId: 3,
    userType: UserType.EMPLOYEE,
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
  const ues: FakeUeWithOfs[] = [];
  for (let i = 0; i < 30; i++) {
    const ue = createUe(app, { code: `XX${`${i}`.padStart(2, '0')}` }) as FakeUeWithOfs;
    ue.ueofs = [
      createUeof(
        app,
        { branchOptions: [branchOptions[(i * 3) % 4]], semesters: [semesters[i % 2]], ue },
        {
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
    ];
    ues.push(ue);
  }
  const ueWithRating = createUe(app, { code: `XX30` }) as FakeUeWithOfs;
  ueWithRating.ueofs = [createUeof(app, { branchOptions: [branchOptions[0]], semesters, ue: ueWithRating })];
  const criterion = createCriterion(app);
  createUeSubscription(app, { user, ueof: ueWithRating.ueofs[0], semester: semesters[0] });
  createUeSubscription(app, { user: user2, ueof: ueWithRating.ueofs[0], semester: semesters[0] });
  const rate1 = createUeRating(app, { user, criterion, ueof: ueWithRating.ueofs[0] }, { value: 3 });
  const rate2 = createUeRating(app, { user: user2, criterion, ueof: ueWithRating.ueofs[0] }, { value: 5 });

  it('should return an error if the ue does not exist', () => {
    return pactum.spec().withBearerToken(user.token).get('/ue/AA01').expectAppError(ERROR_CODE.NO_SUCH_UE, 'AA01');
  });

  it('should return the UE XX01', () => {
    return pactum.spec().withBearerToken(user.token).get('/ue/XX01').expectUe(ues[1], []);
  });

  it('should return the UE XX01 without ratings', () => {
    return pactum.spec().withBearerToken(user3.token).get('/ue/XX01').expectUe(ues[1]);
  });

  it('should return the UE XX30 with rating', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/XX30')
      .expectUe(
        ueWithRating,
        [
          {
            criterionId: criterion.id,
            value: app()
              .get(UeController)
              .computeRate(
                [
                  { ...(rate2 as Required<FakeUeStarVote>), ueofCode: ueWithRating.ueofs[0].code },
                  { ...(rate1 as Required<FakeUeStarVote>), ueofCode: ueWithRating.ueofs[0].code },
                ],
                ueWithRating.ueofs[0].code,
              ),
          },
        ],
        2,
      );
  });
});

export default GetE2ESpec;

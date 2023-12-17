import { createCriterion, createUE, createUser, suite } from '../../test_utils';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { ERROR_CODE } from 'src/exceptions';
import { UEUnComputedDetail } from '../../../src/ue/interfaces/ue-detail.interface';
import { UEService } from '../../../src/ue/ue.service';
import { Criterion } from '../../../src/ue/interfaces/criterion.interface';

export const UEToUEDetailed = (ue: UEUnComputedDetail) => {
  const starVoteCriteria: {
    [key: string]: {
      createdAt: Date;
      value: number;
    }[];
  } = {};
  for (const starVote of ue.starVotes) {
    if (starVote.criterionId in starVoteCriteria)
      starVoteCriteria[starVote.criterionId].push({
        createdAt: starVote.createdAt as Date,
        value: starVote.value,
      });
    else
      starVoteCriteria[starVote.criterionId] = [
        {
          createdAt: starVote.createdAt as Date,
          value: starVote.value,
        },
      ];
  }
  return {
    ...ue,
    openSemester: ue.openSemester.map((semester) => semester.code),
    starVotes: Object.fromEntries(
      Object.entries(starVoteCriteria).map(([key, entry]) => {
        let coefficients = 0;
        let ponderation = 0;
        for (const { value, createdAt } of entry) {
          const dt =
            (starVoteCriteria[key][0].createdAt.getTime() -
              createdAt.getTime()) /
            1000;
          const dp = Math.exp(-dt / 10e7);
          ponderation += dp * value;
          coefficients += dp;
        }
        return [key, ponderation / coefficients];
      }),
    ),
  };
};

const GetRateE2ESpec = suite('Get Rating', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  let ue: UEUnComputedDetail;
  let c1: Criterion;
  let c2: Criterion;

  beforeAll(async () => {
    ue = (await createUE(app, {
      code: `XX00`,
    })) as UEUnComputedDetail;

    c1 = await createCriterion(app, 'difficulty');
    c2 = await createCriterion(app, 'interest');
    await app().get(UEService).doRateUE(user, ue.code, {
      criterion: c1.id,
      value: 1,
    });
    await app().get(UEService).doRateUE(user, ue.code, {
      criterion: c2.id,
      value: 5,
    });
    await app().get(UEService).doRateUE(user2, ue.code, {
      criterion: c1.id,
      value: 2,
    });
  });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .get('/ue/XX00/rate')
      .expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return an error if the ue does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/AA01/rate')
      .expectStatus(HttpStatus.NOT_FOUND)
      .expectJson({
        errorCode: ERROR_CODE.NO_SUCH_UE,
        error: "L'UE AA01 n'existe pas",
      });
  });

  it('should return the user rate for the UE', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/XX00/rate')
      .expectStatus(HttpStatus.OK)
      .expectJson([
        {
          criterionId: c1.id,
          value: 1,
        },
        {
          criterionId: c2.id,
          value: 5,
        },
      ]);
  });

  it('should return the user rate for the UE (partial rating)', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .get('/ue/XX00/rate')
      .expectStatus(HttpStatus.OK)
      .expectJson([
        {
          criterionId: c1.id,
          value: 2,
        },
      ]);
  });
});

export default GetRateE2ESpec;

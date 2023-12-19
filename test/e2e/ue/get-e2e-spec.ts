import { createUE, createUser, suite } from '../../test_utils';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { ERROR_CODE } from 'src/exceptions';
import { UEUnComputedDetail } from '../../../src/ue/interfaces/ue-detail.interface';

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

// TODO: checker les rates

const GetE2ESpec = suite('GET /ue/{ueCode}', (app) => {
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
      }),
    );

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get('/ue/XX01').expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return an error if the ue does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/AA01')
      .expectStatus(HttpStatus.NOT_FOUND)
      .expectJson({
        errorCode: ERROR_CODE.NO_SUCH_UE,
        error: 'The UE AA01 does not exist',
      });
  });

  it('should return the UE XX01', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/XX01')
      .expectStatus(HttpStatus.OK)
      .expectJson(UEToUEDetailed(ues.find((ue) => ue.code === 'XX01')));
  });
});

export default GetE2ESpec;

import { createUE, createUser, suite } from '../../test_utils';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { ERROR_CODE } from 'src/exceptions';

const UEToUEDetailed = (
  ue: ReturnType<typeof createUE> extends Promise<infer R> ? R : never,
) => {
  delete ue.createdAt;
  delete ue.id;
  delete ue.updatedAt;
  delete ue.info.id;
  delete ue.info.UEId;
  const starVoteCriteria: {
    [key: string]: {
      createdAt: Date;
      value: number;
    }[];
  } = {};
  for (const starVote of ue.starVotes) {
    if (starVote.criterionId in starVoteCriteria)
      starVoteCriteria[starVote.criterionId].push({
        createdAt: starVote.createdAt,
        value: starVote.value,
      });
    else
      starVoteCriteria[starVote.criterionId] = [
        {
          createdAt: starVote.createdAt,
          value: starVote.value,
        },
      ];
  }
  return {
    code: ue.code,
    inscriptionCode: ue.inscriptionCode,
    name: ue.name,
    validationRate: ue.validationRate,
    info: {
      antecedent: ue.info.antecedent,
      comment: ue.info.comment,
      degree: ue.info.degree,
      languages: ue.info.languages,
      minors: ue.info.minors,
      objectives: ue.info.objectives,
      programme: ue.info.programme,
    },
    openSemesters: ue.openSemester.map((semester) => semester.code),
    workTime: {
      cm: ue.workTime.cm,
      td: ue.workTime.td,
      tp: ue.workTime.tp,
      project: ue.workTime.projet,
      the: ue.workTime.the,
      internship: ue.workTime.internship,
    },
    filieres: ue.filiere.map((filiere) => ({
      code: filiere.code,
      name: filiere.name,
      branch: filiere.branche.code,
      branchName: filiere.branche.name,
    })),
    credits: ue.credits.map((credit) => ({
      count: credit.credits,
      category: credit.category.code,
      categoryName: credit.category.name,
    })),
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

const GetE2ESpec = suite('Get', (app) => {
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
    return pactum.spec().get('/ue/XX01').expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return an error if the ue does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/AA01')
      .expectStatus(HttpStatus.NOT_FOUND)
      .expectBody({
        errorCode: ERROR_CODE.NO_SUCH_UE,
        error: "L'UE AA01 n'existe pas",
      });
  });

  it('should return the UE XX01', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/XX01')
      .expectStatus(HttpStatus.OK)
      .expectBody(UEToUEDetailed(ues.find((ue) => ue.code === 'XX01')));
  });
});

export default GetE2ESpec;

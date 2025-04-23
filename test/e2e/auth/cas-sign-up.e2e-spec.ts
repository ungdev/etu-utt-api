import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { faker } from '@faker-js/faker';
import { JwtService } from '@nestjs/jwt';
import * as fakedb from '../../utils/fakedb';
import { AuthService } from '../../../src/auth/auth.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { string } from 'pactum-matchers';
import { ERROR_CODE } from '../../../src/exceptions';
import { ConfigModule } from '../../../src/config/config.module';
import { LdapUser } from 'ldap-server-mock';
import { HttpStatus } from '@nestjs/common';
import { mockLdapServer } from '../../external_services/ldap';

const CasSignUpE2ESpec = e2eSuite('POST /auth/signup/cas', (app) => {
  const list: LdapUser[] = [];
  const branch = fakedb.createBranch(app);
  const branchOption = fakedb.createBranchOption(app, { branch });
  const semester = fakedb.createSemester(app, {
    code: `${new Date().getMonth() < 7 && new Date().getMonth() > 0 ? 'P' : 'A'}${new Date().getFullYear() % 100}`,
    start: new Date(),
    end: new Date(),
  });
  const ue = fakedb.createUe(app);
  fakedb.createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });

  mockLdapServer(list);

  it('should fail as the provided token is not jwt-generated', () =>
    pactum
      .spec()
      .post('/auth/signup/cas')
      .withJson({ registerToken: faker.random.alpha() })
      .expectAppError(ERROR_CODE.INVALID_TOKEN_FORMAT));

  it('should fail as the provided token does not contains an object in the right form', async () => {
    const token = app()
      .get(JwtService)
      .sign({ a: 'b' }, { expiresIn: 60, secret: app().get(ConfigModule).JWT_SECRET });
    pactum
      .spec()
      .post('/auth/signup/cas')
      .withJson({ registerToken: token })
      .expectAppError(ERROR_CODE.INVALID_TOKEN_FORMAT);
  });

  it('should fail as the user already exists', async () => {
    const user = await fakedb.createUser(app, {}, true);
    await pactum
      .spec()
      .post('/auth/signup/cas')
      .withJson({
        registerToken: await app()
          .get(AuthService)
          .signRegisterUserToken(user.login, faker.internet.email(), user.firstName, user.lastName, 99999),
      })
      .expectAppError(ERROR_CODE.CREDENTIALS_ALREADY_TAKEN);
    await app()
      .get(PrismaService)
      .user.delete({ where: { id: user.id } });
  });

  const executeValidSignupRequest = async (type: string) => {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const login = `${lastName.toLowerCase().slice(0, 7)}${firstName.toLowerCase()}`.slice(0, 8);
    const mail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@utt.fr`;
    const tokenExpiresIn = 9999;
    list.push({
      dn: `uid=${login},ou=people,dc=utt,dc=fr`,
      attributes: {
        uid: login,
        sn: lastName,
        givenName: firstName,
        displayName: `${firstName} ${lastName}`,
        mail: mail,
        supannEmpId: 49777,
        supannEtuId: 49777,
        eduPersonAffiliation: [type, 'member'],
        employeeType: type,
        formation: 'Ingénieur',
        telephonenumber: faker.phone.number('+33 # ## ## ## ##'),
        niveau: `${branch.code}2`,
        filiere: branchOption.code,
        datefin: 20240930,
        jpegPhoto: `http://localhost/${login}.jpg`,
        gidNumber: type === 'student' ? 10000 : type === 'faculty' ? 5000 : 6000,
        uv: ['PETM6', 'SY16', 'LO17', 'RE02', 'IF03', 'CTC1', 'LG11', 'PEICT', ue.code],
      },
    });
    await pactum
      .spec()
      .post('/auth/signup/cas')
      .withJson({
        registerToken: await app()
          .get(AuthService)
          .signRegisterUserToken(login, mail, firstName, lastName, tokenExpiresIn),
      })
      .expectStatus(HttpStatus.CREATED)
      .expectJsonMatch({ token: string() });
    expect(await app().get(PrismaService).user.count({ where: { login } })).toEqual(1);
  };

  it('should successfully create the user and return a token', () => executeValidSignupRequest('student'));
  it('should successfully create the user and return a token (as a teacher)', () =>
    executeValidSignupRequest('faculty'));
  it('should successfully create the user and return a token (as other)', () => executeValidSignupRequest('other'));
});

export default CasSignUpE2ESpec;

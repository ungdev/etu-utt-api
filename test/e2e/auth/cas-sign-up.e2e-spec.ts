import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { faker } from '@faker-js/faker';
import { JwtService } from '@nestjs/jwt';
import * as fakedb from '../../utils/fakedb';
import { AuthService, RegisterData } from '../../../src/auth/auth.service';
import { pick } from '../../../src/utils';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { FakeUser } from '../../utils/fakedb';
import { string } from 'pactum-matchers';
import { ERROR_CODE } from '../../../src/exceptions';
import { ConfigModule } from '../../../src/config/config.module';
import { LdapServerMock, LdapUser } from 'ldap-server-mock';

const CasSignUpE2ESpec = e2eSuite('/auth/signup/cas', (app) => {
  const list: LdapUser[] = [];
  const ldapServer = new LdapServerMock(
    list,
    {
      searchBase: 'ou=people,dc=utt,dc=fr',
      port: Number(process.env.LDAP_URL.split(':')[2]),
    },
    null,
    null,
    {
      // Disable default logging
      info: () => undefined,
    },
  );
  const branch = fakedb.createBranch(app);
  const branchOption = fakedb.createBranchOption(app, { branch });
  fakedb.createSemester(app, {
    code: `${new Date().getMonth() < 7 && new Date().getMonth() > 0 ? 'P' : 'A'}${new Date().getFullYear() % 100}`,
    start: new Date(),
    end: new Date(),
  });
  const ue = fakedb.createUe(app, { branchOptions: [branchOption] });

  beforeAll(() => ldapServer.start());
  afterAll(() => ldapServer.stop());

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
        registerToken: app()
          .get(AuthService)
          .signRegisterToken({
            ...pick(user as Required<FakeUser>, 'login', 'firstName', 'lastName'),
            mail: faker.internet.email(),
          }),
      })
      .expectAppError(ERROR_CODE.CREDENTIALS_ALREADY_TAKEN);
    await app()
      .get(PrismaService)
      .user.delete({ where: { id: user.id } });
  });

  const executeValidSignupRequest = (type: string) => {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const userData: RegisterData = {
      login: `${lastName.toLowerCase().slice(0, 7)}${firstName.toLowerCase()}`.slice(0, 8),
      mail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@utt.fr`,
      firstName,
      lastName,
    };
    list.push({
      dn: `uid=${userData.login},ou=people,dc=utt,dc=fr`,
      attributes: {
        uid: userData.login,
        sn: userData.lastName,
        givenName: userData.firstName,
        displayName: `${userData.firstName} ${userData.lastName}`,
        mail: userData.mail,
        supannEmpId: 49777,
        supannEtuId: 49777,
        eduPersonAffiliation: [type, 'member'],
        employeeType: type,
        formation: 'Ingénieur',
        telephonenumber: faker.phone.number('+33 # ## ## ## ##'),
        niveau: `${branch.code}2`,
        filiere: branchOption.code,
        datefin: 20240930,
        jpegPhoto: `http://localhost/${userData.login}.jpg`,
        gidNumber: type === 'student' ? 10000 : type === 'faculty' ? 5000 : 6000,
        uv: ['PETM6', 'SY16', 'LO17', 'RE02', 'IF03', 'CTC1', 'LG11', 'PEICT', ue.code],
      },
    });
    return pactum
      .spec()
      .post('/auth/signup/cas')
      .withJson({ registerToken: app().get(AuthService).signRegisterToken(userData) })
      .expectJsonMatch({ access_token: string() });
    // TODO : test that the user has been created, along with all its data
  };

  it('should successfully create the user and return a token', () => executeValidSignupRequest('student'));
  it('should successfully create the user and return a token (as a teacher)', () =>
    executeValidSignupRequest('faculty'));
  it('should successfully create the user and return a token (as other)', () => executeValidSignupRequest('other'));
});

export default CasSignUpE2ESpec;

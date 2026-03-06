import { e2eSuite, JsonLike } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { faker } from '@faker-js/faker';
import { JwtService } from '@nestjs/jwt';
import * as fakedb from '../../utils/fakedb';
import { AuthService } from '../../../src/auth/auth.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { ERROR_CODE } from '../../../src/exceptions';
import { ConfigService } from '../../../src/config/config.service';
import { LdapUser } from 'ldap-server-mock';
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
  const ueof = fakedb.createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });

  mockLdapServer(list);

  it('should fail as the provided token is not jwt-generated', () =>
    pactum
      .spec()
      .post('/auth/signup/cas')
      .withJson({ registerToken: faker.string.alpha() })
      .expectAppError(ERROR_CODE.INVALID_TOKEN_FORMAT));

  it('should fail as the provided token does not contains an object in the right form', async () => {
    const token = app()
      .get(JwtService)
      .sign({ a: 'b' }, { expiresIn: 60, secret: app().get(ConfigService).JWT_SECRET });
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

  const getPersonAttributes = (type: 'student' | 'faculty' | 'other') => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const login = `${lastName.toLowerCase().slice(0, 7)}${firstName.toLowerCase()}`.slice(0, 8);
    const mail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@utt.fr`;
    return {
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
      telephonenumber: faker.helpers.fromRegExp(/\+33 \d \d\d \d\d \d\d \d\d/),
      niveau: `${branch.code}2`,
      filiere: branchOption.code,
      datefin: 20240930,
      jpegPhoto: `http://localhost/${login}.jpg`,
      gidNumber: type === 'student' ? '10000' : type === 'faculty' ? '5000' : '9999',
      uv: [ueof.code],
    };
  };
  const executeValidSignupRequest = async (personAttributes) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const login = personAttributes.uid;
    const mail = personAttributes.mail;
    const tokenExpiresIn = 9999;
    list.push({
      dn: `uid=${login},ou=people,dc=utt,dc=fr`,
      attributes: personAttributes,
    });
    const authService = app().get(AuthService);
    await pactum
      .spec()
      .post('/auth/signup/cas')
      .withJson({
        registerToken: await authService.signRegisterUserToken(login, mail, firstName, lastName, tokenExpiresIn),
      })
      .created()
      .$expectRegexableJson({ token: JsonLike.STRING });
    expect(await app().get(PrismaService).user.count({ where: { login } })).toEqual(1);
  };

  it('should successfully create the user and return a token', async () => {
    const personAttribute = getPersonAttributes('student');
    await executeValidSignupRequest(personAttribute);
    await app()
      .get(PrismaService)
      .user.deleteMany({ where: { login: personAttribute.uid } });
  });

  it('should successfully create the user and return a token (as a teacher)', async () => {
    const personAttribute = getPersonAttributes('faculty');
    await executeValidSignupRequest(personAttribute);
    await app()
      .get(PrismaService)
      .user.deleteMany({ where: { login: personAttribute.uid } });
  });
  // Can this happen ? If it does, should we throw an error instead ?
  // it('should successfully create the user and return a token (as other)', () => executeValidSignupRequest(getPersonAttributes('other')));

  it('should successfully create an asso user, along with an Asso', async () => {
    const login = faker.internet.displayName().replaceAll(/[^A-Za-z1-9]/g, '');
    const mail = faker.internet.email();
    const assoName = faker.company.name();
    await executeValidSignupRequest({
      uid: login,
      displayName: assoName,
      mail,
      gidNumber: '6000',
    });
    expect(
      await app()
        .get(PrismaService)
        .asso.count({ where: { name: assoName } }),
    ).toEqual(1);
    await app().get(PrismaService).user.deleteMany({ where: { login } });
  });
});

export default CasSignUpE2ESpec;

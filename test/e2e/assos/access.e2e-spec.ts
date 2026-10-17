import { e2eSuite } from '../../utils/test_utils';
import { createAsso, createAssoMembership, createAssoMembershipRole, createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { MailService } from '../../../src/mail/mail.service';

function tokenFromValidationEmail(mailService: MailService): string {
  const calls = (mailService.send as jest.Mock).mock.calls;
  const text = calls.at(-1)?.[4] as string;
  const link = text.match(/https?:\/\/\S+/)?.[0];
  return new URL(link).searchParams.get('token');
}

const AssoAccessE2ESpec = e2eSuite('POST/GET /assos/access', (app) => {
  const createUserForAccess = createUser(app);
  const wrongUser = createUser(app);
  const claimUser = createUser(app);
  const managedUser = createUser(app);
  const duplicateNameUser = createUser(app);

  const claimAsso = createAsso(app, { name: 'E2E claim association', mail: 'e2e-claim@utt.fr' });
  const managedAsso = createAsso(app, { name: 'E2E managed association', mail: 'e2e-managed@utt.fr' });
  const managedRole = createAssoMembershipRole(app, { asso: managedAsso }, { isPresident: true });
  createAssoMembership(app, { asso: managedAsso, role: managedRole, user: managedUser });
  const duplicateNameAsso = createAsso(app, { name: 'E2E duplicate name', mail: 'e2e-duplicate-existing@utt.fr' });

  beforeAll(async () => {
    await app()
      .get(PrismaService)
      .assoMembershipPermission.createMany({
        data: [{ id: 'manage_infos' }, { id: 'manage_members' }, { id: 'manage_roles' }, { id: 'weekly' }],
      });
    await app()
      .get(PrismaService)
      .assoSympa.create({
        data: { name: 'E2E create association', mail: 'e2e-create@utt.fr' },
      });
    await app()
      .get(PrismaService)
      .assoSympa.create({
        data: { name: 'E2E duplicate source', mail: 'e2e-duplicate-source@utt.fr' },
      });
    await app()
      .get(PrismaService)
      .assoSympa.create({
        data: { name: 'E2E info access source', mail: 'e2e-info-access@utt.fr' },
      });
  });

  it('rejects an unauthenticated access request', () =>
    pactum
      .spec()
      .post('/assos/access/request')
      .withBody({ email: 'e2e-create@utt.fr' })
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('requests CREATE access and returns CREATE information from the validation token', async () => {
    const mailService = app().get(MailService);
    const sendSpy = jest.spyOn(mailService, 'send');

    await pactum
      .spec()
      .withBearerToken(createUserForAccess.token)
      .post('/assos/access/request')
      .withBody({ email: 'e2e-create@utt.fr' })
      .expectBody({ action: 'CREATE', email: 'e2e-create@utt.fr' });

    const token = tokenFromValidationEmail(mailService);
    await pactum
      .spec()
      .withBearerToken(createUserForAccess.token)
      .get('/assos/access/info')
      .withQueryParams('token', token)
      .expectBody({
        action: 'CREATE',
        email: 'e2e-create@utt.fr',
        name: 'E2E create association',
        description: null,
      });
    sendSpy.mockRestore();
  });

  it('creates an association after confirming CREATE access', async () => {
    const mailService = app().get(MailService);
    const sendSpy = jest.spyOn(mailService, 'send');
    await pactum
      .spec()
      .withBearerToken(createUserForAccess.token)
      .post('/assos/access/request')
      .withBody({ email: 'e2e-create-confirm@utt.fr' })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, 'e2e-create-confirm@utt.fr');
    await app()
      .get(PrismaService)
      .assoSympa.create({
        data: { name: 'E2E create confirm association', mail: 'e2e-create-confirm@utt.fr' },
      });

    await pactum
      .spec()
      .withBearerToken(createUserForAccess.token)
      .post('/assos/access/request')
      .withBody({ email: 'e2e-create-confirm@utt.fr' })
      .expectBody({ action: 'CREATE', email: 'e2e-create-confirm@utt.fr' });
    const token = tokenFromValidationEmail(mailService);

    await pactum
      .spec()
      .withBearerToken(createUserForAccess.token)
      .post('/assos/access/confirm')
      .withBody({ token, name: 'E2E created association' })
      .expectJsonLike({
        action: 'CREATE',
        asso: {
          id: /^[0-9a-f-]{36}$/,
          name: 'E2E created association',
          email: 'e2e-create-confirm@utt.fr',
        },
      });
    expect(
      await app()
        .get(PrismaService)
        .asso.findUnique({ where: { mail: 'e2e-create-confirm@utt.fr' } }),
    ).not.toBeNull();
    sendSpy.mockRestore();
  });

  it('rejects CREATE when the requested name already exists', async () => {
    const mailService = app().get(MailService);
    const sendSpy = jest.spyOn(mailService, 'send');
    await pactum
      .spec()
      .withBearerToken(duplicateNameUser.token)
      .post('/assos/access/request')
      .withBody({ email: 'e2e-duplicate-source@utt.fr' })
      .expectBody({ action: 'CREATE', email: 'e2e-duplicate-source@utt.fr' });
    const token = tokenFromValidationEmail(mailService);

    await pactum
      .spec()
      .withBearerToken(duplicateNameUser.token)
      .post('/assos/access/confirm')
      .withBody({ token, name: duplicateNameAsso.name })
      .expectAppError(ERROR_CODE.ASSO_NAME_ALREADY_TAKEN, duplicateNameAsso.name);
    sendSpy.mockRestore();
  });

  it('requests and confirms CLAIM access for an existing association', async () => {
    const mailService = app().get(MailService);
    const sendSpy = jest.spyOn(mailService, 'send');
    await pactum
      .spec()
      .withBearerToken(claimUser.token)
      .post('/assos/access/request')
      .withBody({ email: claimAsso.mail })
      .expectBody({ action: 'CLAIM', email: claimAsso.mail });
    const token = tokenFromValidationEmail(mailService);

    await pactum
      .spec()
      .withBearerToken(claimUser.token)
      .get('/assos/access/info')
      .withQueryParams('token', token)
      .expectBody({
        action: 'CLAIM',
        email: claimAsso.mail,
        name: claimAsso.name,
        description: claimAsso.descriptionTranslation.fr,
      });

    await pactum
      .spec()
      .withBearerToken(claimUser.token)
      .post('/assos/access/confirm')
      .withBody({ token })
      .expectBody({ action: 'CLAIM', asso: { id: claimAsso.id, name: claimAsso.name, email: claimAsso.mail } });
    expect(
      await app()
        .get(PrismaService)
        .assoMembership.count({ where: { assoId: claimAsso.id, userId: claimUser.id } }),
    ).toBe(1);
    sendSpy.mockRestore();
  });

  it('rejects a CLAIM request for an association that already has a manager and records it', async () => {
    await pactum
      .spec()
      .withBearerToken(managedUser.token)
      .post('/assos/access/request')
      .withBody({ email: managedAsso.mail })
      .expectAppError(ERROR_CODE.ASSO_ACCESS_ALREADY_MANAGED);

    const attempt = await app()
      .get(PrismaService)
      .assoAccessAttempt.findFirst({
        where: { assoId: managedAsso.id, userId: managedUser.id },
        orderBy: { createdAt: 'desc' },
      });
    expect(attempt).toMatchObject({
      action: 'CLAIM',
      assoId: managedAsso.id,
      accepted: false,
      status: 'REJECTED',
    });
  });

  it('rejects access information requested by another user', async () => {
    const mailService = app().get(MailService);
    const sendSpy = jest.spyOn(mailService, 'send');
    await pactum
      .spec()
      .withBearerToken(duplicateNameUser.token)
      .post('/assos/access/request')
      .withBody({ email: 'e2e-info-access@utt.fr' })
      .expectBody({ action: 'CREATE', email: 'e2e-info-access@utt.fr' });
    const token = tokenFromValidationEmail(mailService);
    sendSpy.mockRestore();
    await pactum
      .spec()
      .withBearerToken(wrongUser.token)
      .get('/assos/access/info')
      .withQueryParams('token', token)
      .expectAppError(ERROR_CODE.FORBIDDEN_ASSO_ACCESS);
  });
});

export default AssoAccessE2ESpec;

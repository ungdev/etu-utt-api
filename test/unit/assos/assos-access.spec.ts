import { AssosService } from '../../../src/assos/assos.service';
import { AssosController } from '../../../src/assos/assos.controller';
import { ERROR_CODE } from '../../../src/exceptions';
import { MailService } from '../../../src/mail/mail.service';
import { User } from '../../../src/users/interfaces/user.interface';
import { Asso } from '../../../src/assos/interfaces/asso.interface';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { ConfigService } from '../../../src/config/config.service';
import { JwtService } from '@nestjs/jwt';
import UsersService from '../../../src/users/users.service';
import { ImageMediaService } from '../../../src/media/image/imagemedia.service';
import { LexicalModule } from '../../../src/lexical/lexical.module';
import { MailerService } from '@nestjs-modules/mailer';
import { AssoAccessAction, AssoAccessAttemptStatus } from '../../../src/assos/interfaces/asso.interface';
import { unitSuite } from '../../utils/test_utils';

const user = { id: 'user-id' } as unknown as User;
const assoEmail = 'asso@utt.fr';

type AccessTransaction = {
  asso?: { create: jest.Mock };
  assoMembershipRole: { create?: jest.Mock; findFirst?: jest.Mock };
  assoMembership: { create: jest.Mock };
};

type MockPrisma = {
  normalize: { asso: { findUnique: jest.Mock } };
  assoSympa: { findUnique: jest.Mock };
  assoMembership: { count: jest.Mock };
  assoAccessAttempt: { create: jest.Mock; update: jest.Mock };
  $transaction: jest.Mock;
};

type MockJwt = {
  signAsync: jest.Mock;
  verify: jest.Mock;
};

function createService() {
  const prisma: MockPrisma = {
    normalize: { asso: { findUnique: jest.fn() } },
    assoSympa: { findUnique: jest.fn() },
    assoMembership: { count: jest.fn() },
    assoAccessAttempt: { create: jest.fn().mockResolvedValue({}), update: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  };
  const jwt: MockJwt = {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
    verify: jest.fn(),
  };
  const service = new AssosService(
    prisma as unknown as PrismaService,
    {
      JWT_SECRET: 'test-secret',
      ASSOS_MAX_CLAIMS_PER_ASSO: 3,
      ASSOS_MAX_CLAIMS_PER_USER: 5,
      ASSOS_CLAIM_TOKEN_EXPIRATION: 900,
    } as unknown as ConfigService,
    jwt as unknown as JwtService,
  );
  return { service, prisma, jwt };
}

async function expectAppError(promise: Promise<unknown>, errorCode: ERROR_CODE) {
  await expect(promise).rejects.toMatchObject({
    response: expect.objectContaining({ errorCode }),
  });
}

const AssosAccessUnitSpec = unitSuite('Association access', () => {
  it('allows CREATE only when the email exists in AssoSympa', async () => {
    const { service, prisma } = createService();
    prisma.normalize.asso.findUnique.mockResolvedValue(null);
    prisma.assoSympa.findUnique.mockResolvedValue({ id: 'sympa-id', name: 'Club UTT', mail: assoEmail });

    await expect(service.getAssoAccessAction(assoEmail)).resolves.toEqual({
      action: AssoAccessAction.CREATE,
      assoId: null,
    });

    prisma.assoSympa.findUnique.mockResolvedValue(null);
    await expectAppError(service.getAssoAccessAction(assoEmail), ERROR_CODE.NO_SUCH_ASSO);
  });

  it('rejects an association that already has a manager', async () => {
    const { service, prisma } = createService();
    prisma.normalize.asso.findUnique.mockResolvedValue({ id: 'asso-id' });
    prisma.assoMembership.count.mockResolvedValue(1);

    await expectAppError(service.getAssoAccessAction(assoEmail), ERROR_CODE.ASSO_ACCESS_ALREADY_MANAGED);
  });

  it('persists CLAIM and assoId when an association already has a manager', async () => {
    const { service, prisma } = createService();
    prisma.normalize.asso.findUnique.mockResolvedValue({ id: 'asso-id', name: 'Club UTT', mail: assoEmail });
    prisma.assoMembership.count.mockResolvedValue(1);

    await expectAppError(service.requestAssoAccess(user, assoEmail), ERROR_CODE.ASSO_ACCESS_ALREADY_MANAGED);
    expect(prisma.assoAccessAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.id,
        assoEmail,
        accepted: false,
        action: AssoAccessAction.CLAIM,
        assoId: 'asso-id',
        status: AssoAccessAttemptStatus.REJECTED,
      }),
    });
  });

  it('issues a token and persists an accepted attempt', async () => {
    const { service, prisma, jwt } = createService();
    prisma.normalize.asso.findUnique.mockResolvedValue(null);
    prisma.assoSympa.findUnique.mockResolvedValue({ id: 'sympa-id', name: 'Club UTT', mail: assoEmail });

    await expect(service.requestAssoAccess(user, ` ${assoEmail} `)).resolves.toEqual({
      action: AssoAccessAction.CREATE,
      token: 'signed-token',
      email: assoEmail,
    });
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id, assoEmail, action: 'CREATE', jti: expect.any(String) }),
      expect.objectContaining({ secret: 'test-secret', algorithm: 'HS256', expiresIn: 900 }),
    );
    expect(prisma.assoAccessAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.id,
        assoEmail,
        accepted: true,
        action: 'CREATE',
        status: 'REQUESTED',
        tokenId: expect.any(String),
      }),
    });
  });

  it('persists the association id on an accepted CLAIM attempt', async () => {
    const { service, prisma } = createService();
    const existingAsso = { id: 'asso-id', name: 'Club UTT', mail: assoEmail };
    prisma.normalize.asso.findUnique.mockResolvedValue(existingAsso);
    prisma.assoMembership.count.mockResolvedValue(0);

    await expect(service.requestAssoAccess(user, assoEmail)).resolves.toEqual({
      action: AssoAccessAction.CLAIM,
      token: 'signed-token',
      email: assoEmail,
    });
    expect(prisma.normalize.asso.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.assoAccessAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.id,
        assoEmail,
        accepted: true,
        action: AssoAccessAction.CLAIM,
        assoId: existingAsso.id,
        status: AssoAccessAttemptStatus.REQUESTED,
      }),
    });
  });

  it('persists rejected attempts without storing a token', async () => {
    const { service, prisma } = createService();

    await expectAppError(service.requestAssoAccess(user, 'invalid-email'), ERROR_CODE.NO_SUCH_ASSO);
    expect(prisma.assoAccessAttempt.create).toHaveBeenCalledWith({
      data: {
        userId: user.id,
        assoEmail: 'invalid-email',
        accepted: false,
        action: undefined,
        failureReason: ERROR_CODE.NO_SUCH_ASSO,
        tokenId: undefined,
        status: 'REJECTED',
      },
    });
  });

  it('verifies the expected JWT algorithm and rejects invalid signatures', async () => {
    const { service, jwt } = createService();
    jwt.verify.mockReturnValue({
      userId: user.id,
      assoEmail,
      action: AssoAccessAction.CREATE,
      jti: 'request-id',
      iat: 1,
      exp: Math.floor(Date.now() / 1000) + 900,
    });

    expect(service.decodeAssoAccessToken('token')).toEqual(
      expect.objectContaining({ userId: user.id, assoEmail, action: 'CREATE', jti: 'request-id' }),
    );
    expect(jwt.verify).toHaveBeenCalledWith('token', { secret: 'test-secret', algorithms: ['HS256'] });

    jwt.verify.mockImplementation(() => {
      throw new Error('invalid signature');
    });
    await expectAppError(
      Promise.resolve().then(() => service.decodeAssoAccessToken('token')),
      ERROR_CODE.INVALID_ASSO_ACCESS_TOKEN,
    );
  });

  it('returns the standard expired-token error', async () => {
    const { service, jwt } = createService();
    const expiredError = new Error('expired');
    expiredError.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => {
      throw expiredError;
    });

    await expectAppError(
      Promise.resolve().then(() => service.decodeAssoAccessToken('expired-token')),
      ERROR_CODE.EXPIRED_ASSO_ACCESS_TOKEN,
    );
  });

  it('rejects an access token with an invalid payload', async () => {
    const { service, jwt } = createService();
    jwt.verify.mockReturnValue({
      userId: user.id,
      assoEmail,
      action: AssoAccessAction.CLAIM,
      assoId: 42,
      jti: 'request-id',
      exp: Math.floor(Date.now() / 1000) + 900,
    });

    await expectAppError(
      Promise.resolve().then(() => service.decodeAssoAccessToken('malformed-token')),
      ERROR_CODE.INVALID_ASSO_ACCESS_TOKEN,
    );
  });

  it('limits access-link issuance to three requests per association per hour', async () => {
    const { service, prisma } = createService();
    prisma.normalize.asso.findUnique.mockResolvedValue(null);
    prisma.assoSympa.findUnique.mockResolvedValue({ id: 'sympa-id', name: 'Club UTT', mail: assoEmail });

    await service.requestAssoAccess(user, assoEmail);
    await service.requestAssoAccess(user, assoEmail);
    await service.requestAssoAccess(user, assoEmail);

    await expectAppError(service.requestAssoAccess(user, assoEmail), ERROR_CODE.ASSO_ACCESS_RATE_LIMIT);
    expect(prisma.assoAccessAttempt.create).toHaveBeenLastCalledWith({
      data: {
        userId: user.id,
        assoEmail,
        accepted: false,
        action: AssoAccessAction.CREATE,
        failureReason: ERROR_CODE.ASSO_ACCESS_RATE_LIMIT,
        tokenId: undefined,
        status: 'REJECTED',
      },
    });
  });

  it('limits a user before looking up a new email address', async () => {
    const { service, prisma } = createService();
    prisma.normalize.asso.findUnique.mockResolvedValue(null);
    prisma.assoSympa.findUnique.mockResolvedValue({ id: 'sympa-id', name: 'Club UTT', mail: assoEmail });

    for (let attempt = 0; attempt < 5; attempt++) {
      await service.requestAssoAccess(user, `asso-${attempt}@utt.fr`);
    }

    await expectAppError(service.requestAssoAccess(user, 'sixth-asso@utt.fr'), ERROR_CODE.ASSO_ACCESS_RATE_LIMIT);
    expect(prisma.normalize.asso.findUnique).toHaveBeenCalledTimes(5);
    expect(prisma.assoSympa.findUnique).toHaveBeenCalledTimes(5);
  });

  it('returns the AssoSympa name as the default CREATE name', async () => {
    const { service, prisma, jwt } = createService();
    jwt.verify.mockReturnValue({
      userId: user.id,
      assoEmail,
      action: 'CREATE',
      jti: 'request-id',
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    prisma.normalize.asso.findUnique.mockResolvedValue(null);
    prisma.assoSympa.findUnique.mockResolvedValue({ name: 'Club UTT', mail: assoEmail });

    await expect(service.getAssoInfo(service.decodeAssoAccessToken('token'))).resolves.toEqual({
      action: 'CREATE',
      email: assoEmail,
      name: 'Club UTT',
      description: null,
    });
  });

  it('returns the existing association information for a CLAIM token', async () => {
    const { service, prisma, jwt } = createService();
    const existingAsso = {
      id: 'asso-id',
      name: 'Club UTT',
      mail: assoEmail,
      descriptionTranslation: { fr: 'Description' },
    };
    jwt.verify.mockReturnValue({
      userId: user.id,
      assoEmail,
      assoId: existingAsso.id,
      action: AssoAccessAction.CLAIM,
      jti: 'request-id',
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    prisma.normalize.asso.findUnique.mockResolvedValue(existingAsso);
    prisma.assoMembership.count.mockResolvedValue(0);

    await expect(service.getAssoInfo(service.decodeAssoAccessToken('token'))).resolves.toEqual({
      action: AssoAccessAction.CLAIM,
      email: assoEmail,
      name: existingAsso.name,
      description: existingAsso.descriptionTranslation,
    });
  });

  it('creates an association with the AssoSympa default name when omitted', async () => {
    const { service, prisma } = createService();
    jest.spyOn(service, 'decodeAssoAccessToken').mockReturnValue({
      userId: user.id,
      assoEmail,
      action: AssoAccessAction.CREATE,
      jti: 'request-id',
      iat: 1,
      exp: 2,
    });
    jest.spyOn(service, 'resolveAssoAccessAction').mockResolvedValue(AssoAccessAction.CREATE);
    jest.spyOn(service, 'getAssoByEmail').mockResolvedValue(null);
    jest.spyOn(service, 'getAssoSympaByEmail').mockResolvedValue({ id: 'sympa-id', name: 'Club UTT', mail: assoEmail });

    const tx: AccessTransaction = {
      asso: { create: jest.fn().mockResolvedValue({ id: 'asso-id', name: 'Club UTT', mail: assoEmail }) },
      assoMembershipRole: { create: jest.fn().mockResolvedValue({ id: 'role-id' }) },
      assoMembership: { create: jest.fn().mockResolvedValue({ id: 'membership-id' }) },
    };
    prisma.$transaction.mockImplementation((callback: (transaction: AccessTransaction) => unknown) => callback(tx));

    await expect(service.confirmAssoAccess(user, 'token')).resolves.toEqual({
      action: 'CREATE',
      asso: { id: 'asso-id', name: 'Club UTT', mail: assoEmail },
    });
    expect(tx.asso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Club UTT', mail: assoEmail }),
      }),
    );
  });

  it('rejects CREATE when the association name already exists', async () => {
    const { service, prisma } = createService();
    jest.spyOn(service, 'decodeAssoAccessToken').mockReturnValue({
      userId: user.id,
      assoEmail,
      action: AssoAccessAction.CREATE,
      jti: 'request-id',
      iat: 1,
      exp: 2,
    });
    jest.spyOn(service, 'resolveAssoAccessAction').mockResolvedValue(AssoAccessAction.CREATE);
    jest.spyOn(service, 'getAssoByEmail').mockResolvedValue(null);
    jest.spyOn(service, 'getAssoSympaByEmail').mockResolvedValue({ id: 'sympa-id', name: 'Club UTT', mail: assoEmail });
    prisma.normalize.asso.findUnique.mockImplementation(({ where }: { where: { name?: string; mail?: string } }) =>
      where.name ? Promise.resolve({ id: 'existing-asso-id', name: where.name }) : Promise.resolve(null),
    );

    await expectAppError(service.confirmAssoAccess(user, 'token', 'Club UTT'), ERROR_CODE.ASSO_NAME_ALREADY_TAKEN);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('marks a CREATE attempt as failed when its name is missing', async () => {
    const { service, prisma } = createService();
    jest.spyOn(service, 'decodeAssoAccessToken').mockReturnValue({
      userId: user.id,
      assoEmail,
      action: AssoAccessAction.CREATE,
      jti: 'request-id',
      iat: 1,
      exp: 2,
    });
    jest.spyOn(service, 'resolveAssoAccessAction').mockResolvedValue(AssoAccessAction.CREATE);
    jest.spyOn(service, 'getAssoByEmail').mockResolvedValue(null);
    jest.spyOn(service, 'getAssoSympaByEmail').mockResolvedValue(null);

    await expectAppError(service.confirmAssoAccess(user, 'token'), ERROR_CODE.PARAM_MISSING);
    expect(prisma.assoAccessAttempt.update).toHaveBeenCalledWith({
      where: { tokenId: 'request-id' },
      data: {
        status: AssoAccessAttemptStatus.CONFIRM_FAILED,
        confirmationFailureReason: ERROR_CODE.PARAM_MISSING,
      },
    });
  });

  it('claims an existing association without changing its data', async () => {
    const { service, prisma } = createService();
    const existingDescription = { fr: 'Description existante' };
    const existingAsso = {
      id: 'asso-id',
      name: 'Existing Club',
      mail: assoEmail,
      descriptionTranslation: existingDescription,
    } as unknown as Asso;
    jest.spyOn(service, 'decodeAssoAccessToken').mockReturnValue({
      userId: user.id,
      assoEmail,
      assoId: existingAsso.id,
      action: AssoAccessAction.CLAIM,
      jti: 'request-id',
      iat: 1,
      exp: 2,
    });
    jest.spyOn(service, 'resolveAssoAccessAction').mockResolvedValue(AssoAccessAction.CLAIM);
    jest.spyOn(service, 'getAssoByEmail').mockResolvedValue(existingAsso);

    const tx: AccessTransaction = {
      asso: undefined,
      assoMembershipRole: { findFirst: jest.fn().mockResolvedValue({ id: 'role-id', isPresident: true }) },
      assoMembership: { create: jest.fn().mockResolvedValue({ id: 'membership-id' }) },
    };
    prisma.$transaction.mockImplementation((callback: (transaction: AccessTransaction) => unknown) => callback(tx));

    await expect(service.confirmAssoAccess(user, 'token')).resolves.toEqual({
      action: 'CLAIM',
      asso: existingAsso,
      membership: { id: 'membership-id' },
    });
    expect(tx.assoMembership.create).toHaveBeenCalled();
    expect(tx.asso).toBeUndefined();
    expect(existingAsso.descriptionTranslation).toEqual(existingDescription);
  });

  it('creates the president role when claiming an association without one', async () => {
    const { service, prisma } = createService();
    const existingAsso = { id: 'asso-id', name: 'Existing Club', mail: assoEmail } as unknown as Asso;
    jest.spyOn(service, 'decodeAssoAccessToken').mockReturnValue({
      userId: user.id,
      assoEmail,
      assoId: existingAsso.id,
      action: AssoAccessAction.CLAIM,
      jti: 'request-id',
      iat: 1,
      exp: 2,
    });
    jest.spyOn(service, 'resolveAssoAccessAction').mockResolvedValue(AssoAccessAction.CLAIM);
    jest.spyOn(service, 'getAssoByEmail').mockResolvedValue(existingAsso);
    prisma.assoMembership.count.mockResolvedValue(0);

    const tx: AccessTransaction = {
      asso: undefined,
      assoMembershipRole: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'role-id' }),
      },
      assoMembership: { create: jest.fn().mockResolvedValue({ id: 'membership-id' }) },
    };
    prisma.$transaction.mockImplementation((callback: (transaction: AccessTransaction) => unknown) => callback(tx));

    await expect(service.confirmAssoAccess(user, 'token')).resolves.toMatchObject({
      action: AssoAccessAction.CLAIM,
      asso: existingAsso,
      membership: { id: 'membership-id' },
    });
    expect(tx.assoMembershipRole.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ assoId: existingAsso.id, isPresident: true }),
    });
  });

  describe('AssosController association access', () => {
    it('sends the validation link to the association email', async () => {
      const assosService = {
        requestAssoAccess: jest.fn().mockResolvedValue({ action: 'CREATE', token: 'token', email: assoEmail }),
      };
      const prisma = {
        apiApplication: {
          findUnique: jest.fn().mockResolvedValue({ redirectUrl: 'https://etu.utt.fr/' }),
        },
      };
      const mailService = { send: jest.fn().mockResolvedValue(undefined) };
      const controller = new AssosController(
        assosService as unknown as AssosService,
        undefined as unknown as UsersService,
        { ETUUTT_WEBSITE_APPLICATION_ID: 'website-application-id' } as unknown as ConfigService,
        prisma as unknown as PrismaService,
        undefined as unknown as ImageMediaService,
        undefined as unknown as LexicalModule,
        mailService as unknown as MailService,
      );

      await expect(controller.requestAssoAccess(user, { email: assoEmail })).resolves.toEqual({
        action: 'CREATE',
        email: assoEmail,
      });
      expect(mailService.send).toHaveBeenCalledWith(
        assoEmail,
        expect.any(String),
        undefined,
        expect.objectContaining({ action: 'CREATE', email: assoEmail }),
        expect.stringContaining('https://etu.utt.fr/assos/access?token=token'),
      );
      expect(prisma.apiApplication.findUnique).toHaveBeenCalledWith({
        where: { id: 'website-application-id' },
        select: { redirectUrl: true },
      });
    });

    it('notifies the association after a successful claim', async () => {
      const assosService = {
        confirmAssoAccess: jest.fn().mockResolvedValue({
          action: 'CLAIM',
          asso: { id: 'asso-id', name: 'Club UTT', mail: assoEmail },
        }),
      };
      const mailService = { send: jest.fn().mockResolvedValue(undefined) };
      const controller = new AssosController(
        assosService as unknown as AssosService,
        undefined as unknown as UsersService,
        undefined as unknown as ConfigService,
        undefined as unknown as PrismaService,
        undefined as unknown as ImageMediaService,
        undefined as unknown as LexicalModule,
        mailService as unknown as MailService,
      );
      const confirmingUser = { id: user.id, firstName: 'Ada', lastName: 'Lovelace' } as User;

      await controller.confirmAssoAccess(confirmingUser, { token: 'token' });

      expect(mailService.send).toHaveBeenCalledWith(
        assoEmail,
        'Association réclamée sur EtuUTT',
        undefined,
        expect.objectContaining({ action: 'CLAIM', user: confirmingUser }),
        expect.stringContaining('Ada Lovelace'),
      );
    });
  });

  describe('MailService validation email', () => {
    it('swallows mail delivery failures', async () => {
      const mailerService = { sendMail: jest.fn().mockRejectedValue(new Error('SMTP unavailable')) };
      const service = new MailService(mailerService as unknown as MailerService);

      await expect(service.send('asso@utt.fr', 'Validation')).resolves.toBeUndefined();
    });
  });
});

export default AssosAccessUnitSpec;

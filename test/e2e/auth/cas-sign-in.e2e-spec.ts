import { JsonLike, e2eSuite } from '#/utils/test_utils.js';
import * as cas from '#/external_services/cas.js';
import * as fakedb from '#/utils/fakedb.js';
import * as pactum from 'pactum';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service.js';
import AuthCasSignInReqDto from '@/auth/dto/req/auth-cas-sign-in-req.dto.js';
import { DEFAULT_APPLICATION } from '#/../prisma/seed/utils.js';
import { expect, it } from 'vitest';

const CasSignInE2ESpec = e2eSuite('POST /auth/signin/cas', (app) => {
  const body: AuthCasSignInReqDto = {
    ticket: cas.validTicket,
    tokenExpiresIn: cas.user.tokenExpiresIn,
  };

  it('should successfully return a user-register code', () =>
    pactum
      .spec()
      .post('/auth/signin/cas')
      .withBody(body)
      .$expectRegexableJson({ status: 'no_account', token: JsonLike.STRING, redirectUrl: null })
      .expect((res) => {
        const jwt = app().get(JwtService);
        const data = jwt.decode((res.res.json as { token: string }).token);
        expect(data).toMatchObject(cas.user);
      }));

  it('should successfully return an apikey-register code', async () => {
    const user = await fakedb.createUser(app, { login: cas.user.login }, true);
    await app()
      .get(PrismaService)
      .apiKey.delete({ where: { id: user.apiKey.id } });
    await pactum
      .spec()
      .post('/auth/signin/cas')
      .withBody(body)
      .$expectRegexableJson({ status: 'no_api_key', token: JsonLike.STRING, redirectUrl: null })
      .expect((res) => {
        const jwt = app().get(JwtService);
        const data = jwt.decode((res.res.json as { token: string }).token);
        expect(data).toMatchObject({ userId: user.id, applicationId: DEFAULT_APPLICATION.id });
      });
    await app()
      .get(PrismaService)
      .user.delete({ where: { id: user.id } });
  });

  it('should successfully sign in the user', async () => {
    const user = await fakedb.createUser(app, { login: cas.user.login }, true);
    await pactum
      .spec()
      .post('/auth/signin/cas')
      .withBody(body)
      .$expectRegexableJson({ status: 'ok', token: JsonLike.STRING, redirectUrl: null })
      .expect(async (res) => {
        const jwt = app().get(JwtService);
        const data = jwt.decode((res.res.json as { token: string }).token);
        const apiKey = await app()
          .get(PrismaService)
          .apiKey.findFirst({ where: { userId: user.id } });
        expect(data).toMatchObject({ token: apiKey.token });
      });
    await app()
      .get(PrismaService)
      .user.delete({ where: { id: user.id } });
  });
});

export default CasSignInE2ESpec;

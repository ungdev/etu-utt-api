import { e2eSuite } from '../../utils/test_utils';
import * as cas from '../../external_services/cas';
import * as fakedb from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { string } from 'pactum-matchers';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../src/prisma/prisma.service';
import AuthCasSignInReqDto from '../../../src/auth/dto/req/auth-cas-sign-in-req.dto';
import { DEFAULT_APPLICATION } from '../../../prisma/seed/utils';
import {HttpStatus} from "@nestjs/common";

const CasSignInE2ESpec = e2eSuite('POST /auth/signin/cas', (app) => {
  const body: AuthCasSignInReqDto = { service: cas.validService, ticket: cas.validTicket, tokenExpiresIn: cas.user.tokenExpiresIn };

  it('should fail as provided service is not valid', async () => {
    await pactum
      .spec()
      .post('/auth/signin/cas')
      .withBody({ ...body, service: 'wrong service' })
      .expectAppError(ERROR_CODE.INVALID_CAS_TICKET);
    await pactum
      .spec()
      .post('/auth/signin/cas')
      .withBody({ ...body, ticket: 'wrong ticket' })
      .expectAppError(ERROR_CODE.INVALID_CAS_TICKET);
  });

  it('should successfully return a user-register code', () =>
    pactum
      .spec()
      .post('/auth/signin/cas')
      .withBody(body)
      .expectStatus(HttpStatus.OK)
      .expectJsonMatch({ status: 'no_account', token: string() })
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
      .expectJsonMatch({ status: 'no_api_key', token: string() })
      .expect((res) => {
        const jwt = app().get(JwtService);
        const data = jwt.decode((res.res.json as { token: string }).token);
        expect(data).toMatchObject({ userId: user.id, applicationId: DEFAULT_APPLICATION });
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
      .expectJsonMatch({ status: 'ok', token: string() })
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

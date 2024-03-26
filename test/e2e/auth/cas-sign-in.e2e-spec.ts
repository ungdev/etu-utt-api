import { e2eSuite } from '../../utils/test_utils';
import * as cas from '../../external_services/cas';
import * as fakedb from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { string } from 'pactum-matchers';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../src/prisma/prisma.service';

const CasSignInE2ESpec = e2eSuite('/auth/signin/cas', (app) => {
  const body = { service: cas.validService, ticket: cas.validTicket };

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

  it('should successfully return a register code', () =>
    pactum
      .spec()
      .post('/auth/signin/cas')
      .withBody(body)
      .expectJsonMatch({ signedIn: false, access_token: string() })
      .expect((res) => {
        const jwt = app().get(JwtService);
        const data = jwt.decode((res.res.json as { access_token: string }).access_token);
        expect(data).toMatchObject(cas.user);
      }));

  it('should successfully sign in the user', async () => {
    const user = await fakedb.createUser(app, { login: cas.user.login }, true);
    await pactum
      .spec()
      .post('/auth/signin/cas')
      .withBody(body)
      .expectJsonMatch({ signedIn: true, access_token: string() })
      .expect((res) => {
        const jwt = app().get(JwtService);
        const data = jwt.decode((res.res.json as { access_token: string }).access_token);
        expect(data).toMatchObject({ sub: user.id, login: cas.user.login });
      });
    await app()
      .get(PrismaService)
      .user.delete({ where: { id: user.id } });
  });
});

export default CasSignInE2ESpec;

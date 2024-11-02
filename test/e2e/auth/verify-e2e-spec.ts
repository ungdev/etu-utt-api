import * as pactum from 'pactum';
import { e2eSuite } from '../../utils/test_utils';
import { AuthService } from '../../../src/auth/auth.service';
import { ERROR_CODE } from '../../../src/exceptions';

const VerifyE2ESpec = e2eSuite('GET /token/signin', (app) => {
  it('should return a 400 if the token is missing', async () =>
    pactum.spec().get('/auth/signin').expectAppError(ERROR_CODE.NO_TOKEN));

  it('should return a 400 as the header is miss formatted', async () =>
    pactum
      .spec()
      .get('/auth/signin')
      .withHeaders('Authorization', 'this is definitely not the right format')
      .expectAppError(ERROR_CODE.INVALID_TOKEN_FORMAT));

  it('should return that the token is not valid', async () =>
    pactum
      .spec()
      .get('/auth/signin')
      .withHeaders('Authorization', 'Bearer abcdef')
      .expectStatus(200)
      .expectBody({ valid: false }));

  it('should fail as the token has expired', async () => {
    const token = await app().get(AuthService).signAuthenticationToken('abcdef', 0);
    await pactum.spec().get('/auth/signin').withBearerToken(token).expectStatus(200).expectBody({ valid: false });
  });

  it('should return that the token is valid', async () => {
    const token = await app().get(AuthService).signAuthenticationToken('abcdef');
    return pactum.spec().get('/auth/signin').withBearerToken(token).expectStatus(200).expectBody({ valid: true });
  });
});

export default VerifyE2ESpec;

import * as pactum from 'pactum';
import { e2eSuite } from '../../utils/test_utils';
import { AuthService } from '../../../src/auth/auth.service';
import { ConfigService } from '@nestjs/config';

const SignupE2ESpec = e2eSuite('Verify token', (app) => {
  it('should return a 400 if the token is missing', async () => pactum.spec().get('/auth/signin').expectStatus(400));

  it('should return a 400 as the header is miss formatted', async () =>
    pactum
      .spec()
      .get('/auth/signin')
      .withHeaders('Authorization', 'this is definitely not the right format')
      .expectStatus(400));

  it('should return that the token is not valid', async () =>
    pactum
      .spec()
      .get('/auth/signin')
      .withHeaders('Authorization', 'Bearer abcdef')
      .expectStatus(200)
      .expectBody({ valid: false }));

  it('should fail as the token has expired', async () => {
    const config = app().get(ConfigService);
    const originalMethod = config.get.bind(config);
    const spy = jest
      .spyOn(app().get(ConfigService), 'get')
      .mockImplementation((key: string) => (key === 'JWT_EXPIRES_IN' ? 0 : originalMethod(key)));
    const token = await app().get(AuthService).signToken('abcdef', "it's me, mario");
    await pactum.spec().get('/auth/signin').withBearerToken(token).expectStatus(200).expectBody({ valid: false });
    spy.mockRestore();
  });

  it('should return that the token is valid', async () => {
    const token = await app().get(AuthService).signToken('abcdef', "it's me, mario");

    return pactum.spec().get('/auth/signin').withBearerToken(token).expectStatus(200).expectBody({ valid: true });
  });
});

export default SignupE2ESpec;

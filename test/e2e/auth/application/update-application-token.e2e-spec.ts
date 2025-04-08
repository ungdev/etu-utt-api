import { e2eSuite } from '../../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import * as fakedb from '../../../utils/fakedb';
import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../../src/prisma/prisma.service';

const UpdateApplicationTokenE2ESpec = e2eSuite('PATCH /auth/application/:applicationId/token', (app) => {
  const user = fakedb.createUser(app);
  const otherUser = fakedb.createUser(app);
  const application = fakedb.createApplication(app, { owner: user });

  it('should fail as user is not authenticated', () =>
    pactum.spec().patch(`/auth/application/${application.id}/token`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should fail as the application does not exist', () =>
    pactum
      .spec()
      .patch(`/auth/application/ABCDEF/token`)
      .withBearerToken(user.token)
      .expectAppError(ERROR_CODE.NO_SUCH_APPLICATION, 'ABCDEF'));

  it('should fail as user is not the owner of the application', () =>
    pactum.spec().patch(`/auth/application/${application.id}/token`).withBearerToken(otherUser.token).expectAppError(ERROR_CODE.APPLICATION_NOT_OWNED, application.id));

  it('should return a new client secret', () =>
    pactum
      .spec()
      .patch(`/auth/application/${application.id}/token`)
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expect(async (ctx) => {
        expect(ctx.res.json['token']).toBeDefined();
        const token = app().get(JwtService).decode(ctx.res.json['token']).token;
        const apiKey = await app()
          .get(PrismaService)
          .apiKey.findUnique({ where: { userId_applicationId: { userId: user.id, applicationId: application.id } } });
        expect(token).toEqual(apiKey.token);
      }));
});

export default UpdateApplicationTokenE2ESpec;

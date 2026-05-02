import { Dummies, e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import * as fakedb from '../../utils/fakedb';
import { ERROR_CODE } from '../../../src/exceptions';
import { PermissionManager } from '../../../src/utils';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';

const DeleteLinkE2ESpec = e2eSuite('DELETE /link/:id', (app) => {
  const link = fakedb.createLink(app);
  const secondLink = fakedb.createLink(app);
  const user = fakedb.createUser(app, { permissions: new PermissionManager().with('API_MODIFY_LINKS') });
  const userNoPermission = fakedb.createUser(app);

  it('should fail as user is not connected', () => pactum.spec().delete(`/link/${link.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should fail as user does not have permission API_MODIFY_LINKS', () =>
    pactum
      .spec()
      .delete(`/link/${link.id}`)
      .withBearerToken(userNoPermission.token)
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_MODIFY_LINKS'));

  it('should fail as the link does not exist', () =>
    pactum
      .spec()
      .delete(`/link/${Dummies.UUID}`)
      .withBearerToken(user.token)
      .expectAppError(ERROR_CODE.NO_SUCH_LINK, Dummies.UUID));

  it('should successfully delete the link', async () => {
    await pactum
      .spec()
      .delete(`/link/${link.id}`)
      .withBearerToken(user.token)
      .expectLink(link);
    // Verify position of secondLink has changed
    const secondLinkFromDb = await app().get(PrismaService).normalize.link.findUnique({ where: { id: secondLink.id } });
    expect(secondLinkFromDb.position).toBe(0);
    // Set back position of secondLink to 1
    await app().get(PrismaService).link.update({ where: { id: secondLink.id }, data: { position: 1 } });
    await fakedb.createLink(app, link, true);
  });
});

export default DeleteLinkE2ESpec;

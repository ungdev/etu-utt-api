import { e2eSuite, JsonLike } from '../../utils/test_utils';
import * as pactum from 'pactum';
import * as fakedb from '../../utils/fakedb';
import { LinkReqDto } from '../../../src/link/dto/req/link-req.dto';
import { faker } from '@faker-js/faker';
import { ERROR_CODE } from '../../../src/exceptions';
import { PermissionManager } from '../../../src/utils';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';

const CreateLinksE2ESpec = e2eSuite('POST /link', (app) => {
  const existingLink = fakedb.createLink(app);
  const user = fakedb.createUser(app, { permissions: new PermissionManager().with('API_MODIFY_LINKS') });
  const userNoPermission = fakedb.createUser(app);

  const body: LinkReqDto = {
    hyperlink: faker.db.link.hyperlink(),
    name: faker.db.translation(faker.company.name),
    tooltip: faker.db.translation(faker.company.catchPhrase)
  };

  it('should fail as user is not connected', () => pactum.spec().post('/link').withBody(body).expectAppError(ERROR_CODE.NOT_LOGGED_IN))

  it('should fail as user does not have permission API_MODIFY_LINKS', () =>
    pactum
      .spec()
      .post('/link')
      .withBearerToken(userNoPermission.token)
      .withBody(body)
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_MODIFY_LINKS'));

  it('should fail as link already exists', () =>
    pactum
      .spec()
      .post('/link')
      .withBearerToken(user.token)
      .withBody({ ...body, hyperlink: existingLink.hyperlink })
      .expectAppError(ERROR_CODE.LINK_ALREADY_EXISTS));

  it('should successfully create the link', async () => {
    await pactum
      .spec()
      .post('/link')
      .withBearerToken(user.token)
      .withBody(body)
      .expectStatus(HttpStatus.CREATED)
      .expectLink({ id: JsonLike.UUID, ...body });
    const deleted = await app().get(PrismaService).link.deleteMany({where: {id: { not: existingLink.id }}});
    expect(deleted.count).toBe(1);
  });
});

export default CreateLinksE2ESpec;

import { Dummies, e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import * as fakedb from '../../utils/fakedb';
import { faker } from '@faker-js/faker';
import { ERROR_CODE } from '../../../src/exceptions';
import { PermissionManager } from '../../../src/utils';
import { LinkReqDto } from '../../../src/link/dto/req/link-req.dto';
import { PrismaService } from '../../../src/prisma/prisma.service';

const UpdateLinksE2ESpec = e2eSuite('PATCH /link/:id', (app) => {
  let link = fakedb.createLink(app);
  const user = fakedb.createUser(app, { permissions: new PermissionManager().with('API_MODIFY_LINKS') });
  const userNoPermission = fakedb.createUser(app);

  const body = () => ({
    hyperlink: faker.db.link.hyperlink(),
    name: faker.db.translation(faker.company.name),
    tooltip: faker.db.translation(faker.company.catchPhrase),
  } as LinkReqDto);

  it('should fail as user is not connected', () => pactum.spec().patch(`/link/${link.id}`).withBody(body()).expectAppError(ERROR_CODE.NOT_LOGGED_IN))

  it('should fail as user does not have permission API_MODIFY_LINKS', () => pactum.spec().patch(`/link/${link.id}`).withBearerToken(userNoPermission.token).withBody(body()).expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_MODIFY_LINKS'));

  it("should fail as the link doesn't exists", () =>
    pactum
      .spec()
      .patch(`/link/${Dummies.UUID}`)
      .withBearerToken(user.token)
      .withBody(body())
      .expectAppError(ERROR_CODE.NO_SUCH_LINK, Dummies.UUID));

  it('should successfully update the link', () => {
    const thisBody = body()
    pactum
      .spec()
      .patch(`/link/${link.id}`)
      .withBearerToken(user.token)
      .withBody(thisBody)
      .expectLink({ id: link.id, ...thisBody });
    link = {...link, ...thisBody};
  });

  it('should delete language ES from the name as the value is null, but not DE as field is not set', async () => {
    // Build body
    const thisBody = body();
    thisBody.name = {...thisBody.name, es: null, de: undefined};
    // Request
    await pactum
      .spec()
      .patch(`/link/${link.id}`)
      .withBearerToken(user.token)
      .withBody(thisBody)
      .expectLink({ ...link, ...thisBody, name: { ...thisBody.name, es: null, de: link.name.de } });
    // Revert deletion of spanish and update link variable to match the database
    await app().get(PrismaService).link.update({
      where: { id: link.id },
      data: { name: { update: { es: link.name.es } } }
    });
    link = { ...link, ...thisBody, name: { ...thisBody.name, es: link.name.es, de: link.name.de } };
  });
});

export default UpdateLinksE2ESpec;

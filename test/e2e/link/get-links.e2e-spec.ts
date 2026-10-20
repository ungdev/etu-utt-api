import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import * as fakedb from '../../utils/fakedb';
import { createUser } from '../../utils/fakedb';
import { PermissionManager } from '../../../src/utils';

const GetLinksE2ESpec = e2eSuite('GET /link', (app) => {
  const publicLinks = [fakedb.createLink(app), fakedb.createLink(app)];
  const privateLink = fakedb.createLink(app, { public: false });
  const user = createUser(app);
  const userWithPermissions = createUser(app, { permissions: new PermissionManager().with('API_MODIFY_LINKS') });

  it('should return both public links', () => pactum.spec().get('/link').expectLinks(publicLinks));

  it('should return all links, including the private link', () => pactum.spec().get('/link').withBearerToken(user.token).expectLinks([...publicLinks, privateLink]));

  it('should return all links, with their public field as user has permission API_MODIFY_LINKS', () => pactum.spec().get('/link').withBearerToken(userWithPermissions.token).expectLinksForAdmin([...publicLinks, privateLink]))
});

export default GetLinksE2ESpec;

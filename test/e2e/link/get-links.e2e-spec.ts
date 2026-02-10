import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import * as fakedb from '../../utils/fakedb';

const GetLinksE2ESpec = e2eSuite('GET /link', (app) => {
  const links = [fakedb.createLink(app), fakedb.createLink(app)];

  it('should return both links', () => pactum.spec().get('/link').expectLinks(links));
});

export default GetLinksE2ESpec;

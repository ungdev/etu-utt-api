import { e2eSuite } from '../../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import * as fakedb from '../../../utils/fakedb';

const GetApplicationE2ESpec = e2eSuite('GET /auth/application/:applicationId', (app) => {
  const user = fakedb.createUser(app);
  const application = fakedb.createApplication(app, { user });

  it('should fail as application does not exist', () =>
    pactum.spec().get(`/auth/application/ABCDEF`).expectAppError(ERROR_CODE.NO_SUCH_APPLICATION, 'ABCDEF'));

  it('should fail as the unauthorizedUser does not have the permissions to see the applications of user', () =>
    pactum.spec().get(`/auth/application/${application.id}`).expectApplication(application));
});

export default GetApplicationE2ESpec;

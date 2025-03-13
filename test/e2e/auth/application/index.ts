import { E2EAppProvider } from '../../../utils/test_utils';
import GetMyApplicationsE2ESpec from './get-my-applications.e2e-spec';
import GetApplicationsOfUserE2ESpec from './get-applications-of-user.e2e-spec';
import GetApplicationE2ESpec from './get-application.e2e-spec';
import CreateApplicationE2ESpec from './create-application.e2e-spec';
import UpdateClientSecretE2ESpec from './update-client-secret.e2e-spec';
import UpdateApplicationTokenE2ESpec from './update-application-token.e2e-spec';

export default function ApplicationE2ESpec(app: E2EAppProvider) {
  describe('Application', () => {
    GetMyApplicationsE2ESpec(app);
    GetApplicationsOfUserE2ESpec(app);
    GetApplicationE2ESpec(app);
    CreateApplicationE2ESpec(app);
    UpdateClientSecretE2ESpec(app);
    UpdateApplicationTokenE2ESpec(app);
  });
}

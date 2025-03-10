import { E2EAppProvider } from '../../../utils/test_utils';
import GetMyApplicationsE2ESpec from "./get-my-applications.e2e-spec";

export default function ApplicationE2ESpec(app: E2EAppProvider) {
  describe('Application', () => {
    GetMyApplicationsE2ESpec(app);
  });
}

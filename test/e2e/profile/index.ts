import GetE2ESpec from './get-e2e-spec';
import UpdateE2ESpec from './update-e2e-spec';
import { E2EAppProvider } from '../../test_utils';

export default function ProfileE2ESpec(app: E2EAppProvider) {
  describe('Profile', () => {
    GetE2ESpec(app);
    UpdateE2ESpec(app);
  });
}

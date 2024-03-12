import SearchE2ESpec from './search-e2e-spec';
import GetUserE2ESpec from './get-user-e2e-spec';
import GetCurrentUserE2ESpec from './get-user-e2e-spec';
import { E2EAppProvider } from '../../utils/test_utils';

export default function UsersE2ESpec(app: E2EAppProvider) {
  describe('User', () => {
    SearchE2ESpec(app);
    GetUserE2ESpec(app);
    GetCurrentUserE2ESpec(app);
  });
}

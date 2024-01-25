import SearchE2ESpec from './search-e2e-spec';
import FindE2ESpec from './find-e2e-spec';
import { E2EAppProvider } from '../../utils/test_utils';

export default function UsersE2ESpec(app: E2EAppProvider) {
  describe('User', () => {
    SearchE2ESpec(app);
    FindE2ESpec(app);
  });
}

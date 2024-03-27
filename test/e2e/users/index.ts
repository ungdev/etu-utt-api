import SearchE2ESpec from './search-e2e-spec';
import GetUserE2ESpec from './get-user-e2e-spec';
import GetUserProfileE2ESpec from './get-user-profile-e2e-spec';
import GetCurrentUserE2ESpec from './get-current-user-e2e-spec';
import GetUserAssociationE2ESpec from './get-user_assos-e2e-spec';
import { E2EAppProvider } from '../../utils/test_utils';
import UpdateProfile from './update-profile-e2e-spec';

export default function UsersE2ESpec(app: E2EAppProvider) {
  describe('User', () => {
    SearchE2ESpec(app);
    GetUserE2ESpec(app);
    GetUserProfileE2ESpec(app);
    GetCurrentUserE2ESpec(app);
    GetUserAssociationE2ESpec(app);
    UpdateProfile(app);
  });
}

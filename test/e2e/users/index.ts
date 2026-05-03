import SearchE2ESpec from '#/e2e/users/search-e2e-spec';
import GetUserE2ESpec from '#/e2e/users/get-user-e2e-spec';
import GetCurrentUserE2ESpec from '#/e2e/users/get-current-user-e2e-spec';
import GetUserAssociationE2ESpec from '#/e2e/users/get-user_assos-e2e-spec';
import { E2EAppProvider } from '#/utils/test_utils';
import GetTodaysBirthdaysE2ESpec from '#/e2e/users/get-todays-birthdays.e2e-spec';
import UpdateProfile from '#/e2e/users/update-profile-e2e-spec';

export default function UsersE2ESpec(app: E2EAppProvider) {
  describe('User', () => {
    SearchE2ESpec(app);
    GetUserE2ESpec(app);
    GetCurrentUserE2ESpec(app);
    GetUserAssociationE2ESpec(app);
    UpdateProfile(app);
    GetTodaysBirthdaysE2ESpec(app);
  });
}

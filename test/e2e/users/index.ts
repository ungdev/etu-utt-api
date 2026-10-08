import SearchE2ESpec from '#/e2e/users/search-e2e-spec.js';
import GetUserE2ESpec from '#/e2e/users/get-user-e2e-spec.js';
import GetCurrentUserE2ESpec from '#/e2e/users/get-current-user-e2e-spec.js';
import GetUserAssociationE2ESpec from '#/e2e/users/get-user_assos-e2e-spec.js';
import { E2EAppProvider } from '#/utils/test_utils.js';
import GetTodaysBirthdaysE2ESpec from '#/e2e/users/get-todays-birthdays.e2e-spec.js';
import UpdateProfile from '#/e2e/users/update-profile-e2e-spec.js';
import { describe } from 'vitest';

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

import { E2EAppProvider } from '#/utils/test_utils';
import GetHomepageE2ESpec from '#/e2e/profile/get-homepage-widgets.e2e.spec';
import SetHomepageWidgetsE2ESpec from '#/e2e/profile/set-homepage-widgets.e2e-spec';

export default function ProfileE2ESpec(app: E2EAppProvider) {
  describe('Profile', () => {
    GetHomepageE2ESpec(app);
    SetHomepageWidgetsE2ESpec(app);
  });
}

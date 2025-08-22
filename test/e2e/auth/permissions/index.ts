import { E2EAppProvider } from '../../../utils/test_utils';
import GetPermissionsE2ESpec from './get-permissions.e2e-spec';
import GetOwnPermissionsE2ESpec from './get-own-permissions';

export default function PermissionsE2ESpec(app: E2EAppProvider) {
  describe('Permissions', () => {
    GetPermissionsE2ESpec(app);
    GetOwnPermissionsE2ESpec(app);
  });
}

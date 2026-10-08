import { E2EAppProvider } from '#/utils/test_utils.js';
import GetPermissionsE2ESpec from '#/e2e/auth/permissions/get-permissions.e2e-spec.js';
import GetOwnPermissionsE2ESpec from '#/e2e/auth/permissions/get-own-permissions.js';
import { describe } from 'vitest';

export default function PermissionsE2ESpec(app: E2EAppProvider) {
  describe('Permissions', () => {
    GetPermissionsE2ESpec(app);
    GetOwnPermissionsE2ESpec(app);
  });
}

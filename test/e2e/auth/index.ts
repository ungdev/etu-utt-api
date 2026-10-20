import DebugSignUpE2ESpec from '#/e2e/auth/debug-sign-up.e2e-spec.js';
import DebugSignInE2ESpec from '#/e2e/auth/debug-sign-in.e2e-spec.js';
import VerifyE2ESpec from '#/e2e/auth/verify.e2e-spec.js';
import { E2EAppProvider } from '#/utils/test_utils.js';
import SignInE2ESpec from '#/e2e/auth/sign-in.e2e-spec.js';
import SignUpE2ESpec from '#/e2e/auth/sign-up.e2e-spec.js';
import CreateApiKeyE2ESpec from '#/e2e/auth/create-api-key.e2e-spec.js';
import ApplicationE2ESpec from '#/e2e/auth/application/index.js';
import ValidateLoginE2ESpec from '#/e2e/auth/validate-login.e2e-spec.js';
import PermissionsE2ESpec from '#/e2e/auth/permissions/index.js';
import { describe } from 'vitest';

export default function AuthE2ESpec(app: E2EAppProvider) {
  describe('Auth', () => {
    DebugSignUpE2ESpec(app);
    DebugSignInE2ESpec(app);
    SignInE2ESpec(app);
    SignUpE2ESpec(app);
    VerifyE2ESpec(app);
    CreateApiKeyE2ESpec(app);
    ValidateLoginE2ESpec(app);
    ApplicationE2ESpec(app);
    PermissionsE2ESpec(app);
  });
}

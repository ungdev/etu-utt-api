import SignUpE2ESpec from '#/e2e/auth/signup-e2e-spec.js';
import SignInE2ESpec from '#/e2e/auth/signin-e2e-spec.js';
import VerifyE2ESpec from '#/e2e/auth/verify-e2e-spec.js';
import { E2EAppProvider } from '#/utils/test_utils.js';
import CasSignInE2ESpec from '#/e2e/auth/cas-sign-in.e2e-spec.js';
import CasSignUpE2ESpec from '#/e2e/auth/cas-sign-up.e2e-spec.js';
import CreateApiKeyE2ESpec from '#/e2e/auth/create-api-key.e2e-spec.js';
import ApplicationE2ESpec from '#/e2e/auth/application/index.js';
import ValidateLoginE2ESpec from '#/e2e/auth/validate-login.e2e-spec.js';
import PermissionsE2ESpec from '#/e2e/auth/permissions/index.js';
import { describe } from 'vitest';

export default function AuthE2ESpec(app: E2EAppProvider) {
  describe('Auth', () => {
    SignUpE2ESpec(app);
    SignInE2ESpec(app);
    VerifyE2ESpec(app);
    CasSignInE2ESpec(app);
    CasSignUpE2ESpec(app);
    CreateApiKeyE2ESpec(app);
    ValidateLoginE2ESpec(app);
    ApplicationE2ESpec(app);
    PermissionsE2ESpec(app);
  });
}

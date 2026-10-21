import DebugSignUpE2ESpec from '#/e2e/auth/debug-sign-up-e2e-spec';
import DebugSignInE2ESpec from '#/e2e/auth/debug-sign-in-e2e-spec';
import VerifyE2ESpec from '#/e2e/auth/verify-e2e-spec';
import { E2EAppProvider } from '#/utils/test_utils';
import SignInE2ESpec from '#/e2e/auth/sign-in.e2e-spec';
import SignUpE2ESpec from '#/e2e/auth/sign-up.e2e-spec';
import CreateApiKeyE2ESpec from '#/e2e/auth/create-api-key.e2e-spec';
import ApplicationE2ESpec from '#/e2e/auth/application';
import ValidateLoginE2ESpec from '#/e2e/auth/validate-login.e2e-spec';
import PermissionsE2ESpec from '#/e2e/auth/permissions';

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

import DebugSignUpE2ESpec from './debug-sign-up-e2e-spec';
import DebugSignInE2ESpec from './debug-sign-in-e2e-spec';
import VerifyE2ESpec from './verify-e2e-spec';
import { E2EAppProvider } from '../../utils/test_utils';
import SignInE2ESpec from './sign-in.e2e-spec';
import SignUpE2ESpec from './sign-up.e2e-spec';
import CreateApiKeyE2ESpec from './create-api-key.e2e-spec';
import ApplicationE2ESpec from './application';
import ValidateLoginE2ESpec from './validate-login.e2e-spec';
import PermissionsE2ESpec from './permissions';

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

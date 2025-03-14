import SignUpE2ESpec from './signup-e2e-spec';
import SignInE2ESpec from './signin-e2e-spec';
import VerifyE2ESpec from './verify-e2e-spec';
import { E2EAppProvider } from '../../utils/test_utils';
import CasSignInE2ESpec from './cas-sign-in.e2e-spec';
import CasSignUpE2ESpec from './cas-sign-up.e2e-spec';
import CreateApiKeyE2ESpec from './create-api-key.e2e-spec';
import ApplicationE2ESpec from './application';
import ValidateLoginE2ESpec from "./validate-login.e2e-spec";

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
  });
}
